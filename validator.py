"""
Event Graph Validator — checks logical consistency of event annotations.

Validation checks:
1. Duplicate detection — overlapping spans, identical triggers, duplicate relations
2. Cycle detection — DFS on SuperSub/SubSuper graph (via coref-equivalence classes)
3. Contradiction detection — mutually exclusive relations
4. Transitive consistency warnings — missing implied edges (via coref-equivalence classes)
"""

from __future__ import annotations
from typing import Any

EventDict = dict[str, list]  # event_id -> [trigger, [start, end], type]
RelationDict = dict[str, list]  # rel_id -> [[src, tgt], type, src_text, tgt_text]


def validate(text: str, events: EventDict, relations: RelationDict) -> dict[str, Any]:
    errors: list[dict] = []
    warnings: list[dict] = []

    _check_span_matches(text, events, errors)
    _check_duplicates(events, relations, errors)
    _check_contradictions(events, relations, errors)
    _check_cycles(events, relations, errors)
    _check_transitive_consistency(events, relations, warnings)

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "stats": {
            "event_count": len(events),
            "relation_count": len(relations),
            "error_count": len(errors),
            "warning_count": len(warnings),
        },
    }


def _check_span_matches(text: str, events: EventDict, errors: list) -> None:
    """Validate that each event's trigger text matches the text at its character span."""
    if not text:
        return
    for eid, data in events.items():
        trigger, (start, end), _type = data
        if start < 0 or end > len(text) or start >= end:
            errors.append({
                "type": "span_mismatch",
                "message": f"Event '{eid}' span [{start},{end}] is out of bounds (text length: {len(text)})",
                "details": {"event_id": eid, "span": [start, end]},
            })
            continue
        actual = text[start:end]
        if actual != trigger:
            errors.append({
                "type": "span_mismatch",
                "message": f"Event '{eid}' trigger '{trigger}' does not match text at span [{start},{end}]: '{actual}'",
                "details": {"event_id": eid, "expected": trigger, "actual": actual, "span": [start, end]},
            })


def _check_duplicates(events: EventDict, relations: RelationDict, errors: list) -> None:
    event_list = [(eid, data[1][0], data[1][1], data[0], data[2]) for eid, data in events.items()]
    for i in range(len(event_list)):
        for j in range(i + 1, len(event_list)):
            eid1, s1, e1, trig1, typ1 = event_list[i]
            eid2, s2, e2, trig2, typ2 = event_list[j]
            # Check overlapping spans (any overlap)
            if s1 < e2 and s2 < e1:
                errors.append({
                    "type": "duplicate",
                    "message": f"Overlapping character spans: event '{eid1}' [{s1},{e1}] and event '{eid2}' [{s2},{e2}]",
                    "details": {
                        "event_ids": [eid1, eid2],
                        "spans": [[s1, e1], [s2, e2]],
                    },
                })

    # Check for duplicate relations (same source, target, type)
    rel_list = [(rid, data[0][0], data[0][1], data[1]) for rid, data in relations.items()]
    for i in range(len(rel_list)):
        for j in range(i + 1, len(rel_list)):
            rid1, src1, tgt1, typ1 = rel_list[i]
            rid2, src2, tgt2, typ2 = rel_list[j]
            if src1 == src2 and tgt1 == tgt2 and typ1 == typ2:
                errors.append({
                    "type": "duplicate",
                    "message": f"Duplicate relation: '{rid1}' and '{rid2}' have same source, target, and type",
                    "details": {
                        "relation_ids": [rid1, rid2],
                        "source": src1,
                        "target": tgt1,
                        "type": typ1,
                    },
                })


def _check_contradictions(events: EventDict, relations: RelationDict, errors: list) -> None:
    for rid, data in relations.items():
        src, tgt = data[0][0], data[0][1]
        rtype = data[1]

        # Coref self-loop check
        if rtype == "Coref" and src == tgt:
            errors.append({
                "type": "contradiction",
                "message": f"Coref relation '{rid}' has identical source and target '{src}' (self-loop)",
                "details": {"relation_id": rid, "event_id": src},
            })

    # Check for contradictory relation pairs
    rel_pairs = [(rid, data[0][0], data[0][1], data[1]) for rid, data in relations.items()]
    for i in range(len(rel_pairs)):
        for j in range(i + 1, len(rel_pairs)):
            rid1, src1, tgt1, typ1 = rel_pairs[i]
            rid2, src2, tgt2, typ2 = rel_pairs[j]

            # Both directions claim SuperSub (A>B and B>A)
            if typ1 == "SuperSub" and typ2 == "SuperSub" and src1 == tgt2 and tgt1 == src2:
                errors.append({
                    "type": "contradiction",
                    "message": f"Bidirectional SuperSub contradiction: '{rid1}' (SuperSub) and '{rid2}' (SuperSub) are reversed",
                    "details": {
                        "relation_ids": [rid1, rid2],
                        "events": [src1, tgt1],
                    },
                })

            # Same pair has both SuperSub and SubSuper
            if typ1 == "SuperSub" and typ2 == "SubSuper" and src1 == src2 and tgt1 == tgt2:
                errors.append({
                    "type": "contradiction",
                    "message": f"Contradictory relation types: '{rid1}' is SuperSub but '{rid2}' is SubSuper for same pair ({src1}→{tgt1})",
                    "details": {
                        "relation_ids": [rid1, rid2],
                        "events": [src1, tgt1],
                    },
                })
            if typ1 == "SuperSub" and typ2 == "SubSuper" and src1 == tgt2 and tgt1 == src2:
                errors.append({
                    "type": "contradiction",
                    "message": f"Contradictory relation types: '{rid1}' is SuperSub({src1}→{tgt1}) but '{rid2}' is SubSuper({src2}→{tgt2}) — same pair reversed",
                    "details": {
                        "relation_ids": [rid1, rid2],
                        "events": [src1, tgt1],
                    },
                })

    # Coref chain inconsistency: if Coref(A,B) and Coref(A,C) but SuperSub(B,C) → inconsistent
    # Use union-find to compute equivalence classes properly
    parent: dict[str, str] = {}
    def find(x):
        while parent.get(x, x) != x:
            parent[x] = parent.get(parent[x], parent[x])
            x = parent[x]
        return x
    def union(a, b):
        pa, pb = find(a), find(b)
        if pa != pb:
            parent[pa] = pb

    all_eids = set(events.keys())
    for _rid, data in relations.items():
        all_eids.add(data[0][0])
        all_eids.add(data[0][1])
    for eid in all_eids:
        parent.setdefault(eid, eid)

    for _rid, data in relations.items():
        if data[1] == "Coref":
            union(data[0][0], data[0][1])

    canonical = {eid: find(eid) for eid in all_eids}

    # If any SuperSub/SubSuper connects events in the same coref class, it's a contradiction
    for rid, data in relations.items():
        if data[1] in ("SuperSub", "SubSuper"):
            src, tgt = data[0][0], data[0][1]
            if canonical[src] == canonical[tgt]:
                errors.append({
                    "type": "contradiction",
                    "message": f"Inconsistent coref chain: '{rid}' declares hierarchy between coreferent events '{src}' and '{tgt}'",
                    "details": {"relation_id": rid, "events": [src, tgt]},
                })


def _check_cycles(events: EventDict, relations: RelationDict, errors: list) -> None:
    # Build coref equivalence via union-find
    parent: dict[str, str] = {}
    def find(x):
        while parent.get(x, x) != x:
            parent[x] = parent.get(parent[x], parent[x])
            x = parent[x]
        return x
    def union(a, b):
        pa, pb = find(a), find(b)
        if pa != pb:
            parent[pa] = pb

    all_nodes: set[str] = set(events.keys())
    for _, data in relations.items():
        all_nodes.add(data[0][0])
        all_nodes.add(data[0][1])
    for n in all_nodes:
        parent.setdefault(n, n)
    for _, data in relations.items():
        if data[1] == "Coref":
            union(data[0][0], data[0][1])
    canonical = {n: find(n) for n in all_nodes}

    # Build adjacency on canonical IDs
    adj: dict[str, set] = {}
    for rid, data in relations.items():
        rtype = data[1]
        if rtype in ("SuperSub", "SubSuper"):
            cs, ct = canonical[data[0][0]], canonical[data[0][1]]
            if cs != ct:
                adj.setdefault(cs, set()).add(ct)

    # DFS-based cycle detection with 3-color marking
    WHITE, GRAY, BLACK = 0, 1, 2
    color: dict[str, int] = {n: WHITE for n in canonical.values()}
    dfs_parent: dict[str, str | None] = {}

    def dfs(node: str) -> list[str] | None:
        color[node] = GRAY
        for neighbor in adj.get(node, set()):
            if color.get(neighbor) == GRAY:
                path = [neighbor, node]
                curr = node
                while dfs_parent.get(curr) and dfs_parent[curr] != neighbor:
                    curr = dfs_parent[curr]
                    path.append(curr)
                path.append(neighbor)
                path.reverse()
                return path
            if color.get(neighbor) == WHITE:
                dfs_parent[neighbor] = node
                result = dfs(neighbor)
                if result:
                    return result
        color[node] = BLACK
        return None

    for node in list(color.keys()):
        if color[node] == WHITE:
            dfs_parent[node] = None
            cycle = dfs(node)
            if cycle:
                errors.append({
                    "type": "cycle",
                    "message": f"Circular hierarchy detected: {' → '.join(cycle)}",
                    "details": {"cycle": cycle},
                })


def _check_transitive_consistency(events: EventDict, relations: RelationDict, warnings: list) -> None:
    # Build coref equivalence classes
    parent: dict[str, str] = {}
    def find(x):
        while parent.get(x, x) != x:
            parent[x] = parent.get(parent[x], parent[x])
            x = parent[x]
        return x
    def union(a, b):
        pa, pb = find(a), find(b)
        if pa != pb:
            parent[pa] = pb

    all_eids = set(events.keys())
    for rid, data in relations.items():
        all_eids.add(data[0][0])
        all_eids.add(data[0][1])
    for eid in all_eids:
        parent.setdefault(eid, eid)

    for rid, data in relations.items():
        if data[1] == "Coref":
            src, tgt = data[0][0], data[0][1]
            if src != tgt:
                union(src, tgt)

    canonical: dict[str, str] = {eid: find(eid) for eid in all_eids}

    # Build hierarchy using canonical IDs
    super_of: dict[str, set] = {}
    sub_of: dict[str, set] = {}

    for rid, data in relations.items():
        rtype = data[1]
        src, tgt = data[0][0], data[0][1]
        cs, ct = canonical.get(src, src), canonical.get(tgt, tgt)
        if cs == ct:
            continue  # same equivalence class, skip
        if rtype == "SuperSub":
            super_of.setdefault(cs, set()).add(ct)
            sub_of.setdefault(ct, set()).add(cs)
        elif rtype == "SubSuper":
            super_of.setdefault(ct, set()).add(cs)
            sub_of.setdefault(cs, set()).add(ct)

    # Transitive check on canonical graph
    for a in super_of:
        for b in list(super_of.get(a, set())):
            for c in list(super_of.get(b, set())):
                if c not in super_of.get(a, set()) and c != a:
                    warnings.append({
                        "type": "transitive",
                        "message": f"Transitive closure missing: SuperSub('{a}','{b}') and SuperSub('{b}','{c}') exist, but SuperSub('{a}','{c}') is missing",
                        "details": {"missing": [a, c], "path": [a, b, c]},
                    })

    # Check for multiple super-events per canonical sub-event
    for b, supers in sub_of.items():
        if len(supers) > 1:
            sups_sorted = sorted(supers)
            warnings.append({
                "type": "transitive",
                "message": f"Event '{b}' has {len(supers)} super-events: {', '.join(sups_sorted)} — possible inconsistency",
                "details": {"event": b, "super_events": sups_sorted},
            })
