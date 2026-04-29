# Smart Communication Menu Design

## Goal

Group the IM chat module and AI configuration entries under one sidebar menu so users can find business chat, AI chat testing, model settings, and AI workflow from the same navigation area.

## Menu Structure

Create a top-level sidebar section named `智能沟通` with these entries in order:

- `即时通信` at `/im`, described as `消息中心 + AI接待`
- `AI聊天` at `/ai/chat`, described as `模型对话测试`
- `AI设置` at `/ai/settings`, described as `模型与接口配置`
- `AI工作流` at `/ai/workflow`, described as `产品创意生成`

Remove `即时通信` from `常用功能`. Remove the old standalone `AI 模块` section so the same AI entries are not duplicated.

## Behavior

The new section should be open by default and should auto-open when one of its routes is active. Existing route definitions stay unchanged.

## Testing

Add a static script test that parses `src/components/sideMenu.vue` and verifies:

- the `智能沟通` section exists;
- it contains `/im`, `/ai/chat`, `/ai/settings`, and `/ai/workflow`;
- `/im` is not still inside `常用功能`;
- the old `AI 模块` section title is gone;
- `smart-communication` is included in the default opened sections.
