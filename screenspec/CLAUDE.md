# Project rules

- When the user uploads, pastes or links an image or screenshot of a website or UI, run the `screenspec` skill (`SKILL.md` at the repo root, installed as `~/.claude/skills/screenspec`) on it right away, even if the message has no other instructions. Before starting, always ask where to build: Figma (suggest file `D2YSLONP8r5J69GiH8YBwK`, Playground page, below the latest section, or another file/node) or local HTML or spec only, unless the request already says. Then follow the skill: ask about the blind test and research the live site.
- In Figma builds, don't create variables or text styles. Ask first if a build seems to need them.
