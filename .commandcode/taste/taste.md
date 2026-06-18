# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# architecture
- Uploaded JSON files auto-persist to server; the Save button triggers download to local machine, not server-side save. Confidence: 0.70

# validation
- Cycle detection should only check SuperSub/SubSuper relations, not all relation types. Confidence: 0.70
- Remove the "identical trigger text" duplicate check — events with the same trigger text but different spans are valid. Confidence: 0.70
- Validation logic exists in both frontend and backend; changes to validation rules must be applied to both sides. Confidence: 0.65
- Validate that the trigger text matches the actual text at the event's character span in the source text. Confidence: 0.70
