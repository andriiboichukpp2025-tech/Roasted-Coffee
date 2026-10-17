# Налаштування CI/CD для Vercel

Workflow GitHub Actions перевіряє синтаксис усіх `js/*.js` на Node.js 20, а потім виконує production deploy у Vercel. Автоматичний запуск відбувається після push у `main`; workflow також можна запустити вручну у вкладці Actions.

## 1. Прив'язати локальний проєкт до Vercel

У терміналі відкрийте папку проєкту й виконайте:

```bash
npx vercel login
npx vercel link
```

Під час `vercel link` оберіть потрібний акаунт/team та наявний проєкт Roasted Coffee. Команда створить `.vercel/project.json` локально; цей каталог ігнорується Git і не повинен комітитися.

## 2. Знайти ідентифікатори проєкту

Відкрийте `.vercel/project.json` у папці проєкту. Скопіюйте значення `orgId` і `projectId`; вони потрібні як `VERCEL_ORG_ID` та `VERCEL_PROJECT_ID`. Не публікуйте цей файл чи значення у вихідному коді.

## 3. Створити токен Vercel

У Vercel відкрийте **Account Settings → Tokens**, створіть токен із мінімально потрібним доступом до team/project та скопіюйте його одразу. Він використовується як `VERCEL_TOKEN`; не додавайте його до файлів, комітів або логів.

## 4. Додати GitHub Actions secrets

У GitHub відкрийте репозиторій → **Settings → Secrets and variables → Actions → New repository secret**. Створіть три repository secrets із точними назвами:

| Secret | Значення |
|---|---|
| `VERCEL_TOKEN` | Токен, створений у Vercel |
| `VERCEL_ORG_ID` | `orgId` із `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `projectId` із `.vercel/project.json` |

Workflow передає їх лише через job-level `env`; секрети не потрібно записувати у YAML чи інші файли.

## 5. Уникнути подвійного production deploy

Git-інтеграція Vercel уже може автоматично деплоїти кожен push. Якщо залишити її production deploy активним, той самий push може запустити і Vercel Git deployment, і цей workflow.

Варіанти:

1. **Вимкнути Git-інтеграцію Vercel для проєкту.** У налаштуваннях Vercel Project від'єднайте Git repository. Після цього production deploy контролює GitHub Actions. Це найпростіший і найпередбачуваніший варіант, але автоматичні Vercel Preview Deployments через Git-інтеграцію також припиняться.
2. **Налаштувати Ignored Build Step у Vercel.** Залиште інтеграцію для preview deployment, але в налаштуваннях Git Ignored Build Step задайте production-only правило, яке пропускає автоматичний build для `main`, наприклад:

   ```bash
   if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
     exit 0
   else
     exit 1
   fi
   ```

   Для Ignored Build Step код завершення `0` означає пропустити build, а `1` — продовжити. Це залишає Vercel Preview Deployments для інших гілок, але потребує перевірити налаштування на тестовому push; CLI deployment із GitHub Actions запускається окремо.

Оберіть один варіант до злиття в `main`. Якщо preview deployments не потрібні, від'єднання Git — простіше; якщо потрібні, Ignored Build Step зберігає preview, але додає умовну конфігурацію.

## 6. Злити зміни та запустити production workflow

Після налаштування трьох secrets і захисту від подвійного деплою виконайте локально:

```bash
git checkout main
git merge performance-audit
git push origin main
```

Push — це окрема дія, що надсилає зміни до GitHub і запускає workflow. Перевірте репозиторій і гілку перед виконанням команд.

## 7. Перевірити запуск

У GitHub відкрийте вкладку **Actions** → **CI/CD Production Deploy** → запуск для потрібного commit. Переконайтеся, що job `check` успішний і після нього завершився job `deploy`. Помилки Vercel CLI будуть у логах кроків deploy; значення secrets GitHub маскує.

Workflow доступний також через **Actions → CI/CD Production Deploy → Run workflow**. Ручний запуск завжди виконує production deploy, тому перевірте вибрану гілку перед стартом.

## 8. Відкотити production deployment

У Vercel відкрийте проєкт → **Deployments**, знайдіть останній відомий справний production deployment і скористайтеся дією **Promote to Production** або **Rollback** (назва залежить від доступного меню/інтерфейсу). Перевірте production URL після перемикання. Відкат deployment не змінює Git-історію; окремо виправте причину в коді та внесіть звичайну зміну через `main`.
