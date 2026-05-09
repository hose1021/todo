# Habbit Garden

Геймифицированный трекер привычек. Выполняй задачи, зарабатывай XP и кристаллы, покупай и выращивай виртуальный сад.

## Запуск

```bash
bun install
bun dev        # localhost:3000
bun run build  # production build
```

## Как играть

1. **Добавь привычку** — просто название задачи
2. **Выполняй** — получай +10 XP и +10 💎
3. **Покупай растения** в магазине за кристаллы
4. **Сажай** в любую клетку сада (6×5 грядка)
5. **Растение растёт** — 2 часа до стадии 1, 6 часов до стадии 2
6. **Улучшай** за кристаллы до следующих стадий (3→4→5)

## Стек

- Next.js 14 (App Router)
- TypeScript (strict)
- Tailwind CSS 3
- localStorage для сохранений
- Web Audio API для звуков

## Команды

```bash
bun dev           # dev-сервер
bun run build     # production сборка
bun run lint      # ESLint
bunx tsc --noEmit # typecheck
```
