# AZ-900 content guidelines

This app prepares people for Microsoft’s AZ-900: Microsoft Azure Fundamentals exam. The question bank must stay original, current, and defensible.

## Production content requirements

Production AZ-900 items must:

- Be original. Write every stem, option, and explanation from public teaching points.
- Never be copied from exam dumps, brain dumps, “actual exam questions,” or reconstructed candidate recall.
- Be fact-checked against current Microsoft Learn documentation, not against unofficial quiz sites.
- Retain a `sourceUrl`, `sourceTitle`, and `verifiedDate` on every item.
- Be re-reviewed when Microsoft publishes updated AZ-900 skills outline or when the cited Learn article changes.

If a fact cannot be confirmed in current Microsoft documentation, do not ship the item as `verified`.

## Development sample content

The repository currently includes a small set of original placeholder questions marked `contentStatus: "development_sample"`.

These items exist so the product can be built and tested offline. They:

- are not Microsoft exam questions
- have not been verified by Microsoft
- must not be marketed as a complete or official bank
- will be replaced or independently verified before a production content release

Do not scrape certification dumps to “fill out” the bank.

## Review process

When adding or editing a production question:

1. Map it to a current official objective and subobjective.
2. Confirm the correct answer and each distractor explanation against Microsoft Learn.
3. Store the Learn URL and the date the article was checked.
4. Increment `questionVersion` when the wording or answer changes.
5. Re-open the item if Microsoft changes the related objective or retires the cited service behavior.

## Style

- Prefer clear, exam-like stems without trivia or vendor slogans.
- Use four options and explain every option, including the correct one.
- Avoid questions that can only be answered by memorizing an unofficial dump.
- Prefer currently available Azure product names (for example Microsoft Entra ID, not only the historical Azure AD name, unless the item is explicitly historical).
