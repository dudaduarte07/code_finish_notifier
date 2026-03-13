# Code Finish Notifier 🔔

Never forget when your code finishes running again.

**Code Finish Notifier** alerts you when a task, debug session, or terminal command finishes executing in VS Code.

Perfect for developers who frequently run long processes like:

- Scrapy spiders
- Python scripts
- Node servers
- Data pipelines
- Builds
- Tests

Instead of constantly checking the terminal, the extension notifies you automatically.

---

# Features

✔ Desktop notification when execution finishes  
✔ Shows which command/script finished  
✔ Optional sound alert  
✔ Detects:

- Debug sessions
- VS Code Tasks
- Terminal commands (Python, Node, Scrapy, etc)

✔ Shows execution time  
✔ Click notification to return to the terminal

Example notification:

```
scrapy crawl spider_name finished successfully
Duration: 2m 14s
```


---

# Why this extension?

Many developers run long processes and forget to check when they finish.

Examples:

- Running a **Scrapy spider**
- Executing **large Python scripts**
- Running **build pipelines**
- Executing **tests**
- Running **machine learning training**

This extension solves that problem.

---

# Settings

You can configure the extension in VS Code settings.

| Setting | Description |
|------|------|
| `codeFinishNotifier.enabled` | Enable or disable notifications |
| `codeFinishNotifier.showDesktopNotification` | Show system notification |
| `codeFinishNotifier.showPopup` | Show VS Code popup |
| `codeFinishNotifier.playSound` | Play sound alert |
| `codeFinishNotifier.notifyOn` | Notify on success, error, or both |
| `codeFinishNotifier.includeDuration` | Show execution time |
| `codeFinishNotifier.includeCommandPreview` | Show command preview |

---

# Supported executions

The extension automatically detects:

### Debug

```
Run Python File
Run Node Program
Run Java Application
```


### Tasks

``` bash
npm run build
npm run test
```


### Terminal commands

```bash
python script.py
scrapy crawl spider
node app.js
uv run program
go run main.go
```


---

# Installation

Install from the VS Code Marketplace.

Or install manually:

```bash
code --install-extension code-finish-notifier
```


---

# Requirements

VS Code version **1.90+**

Terminal shell integration recommended for better detection.

---

# Contributing

Contributions are welcome!

Feel free to open issues or submit pull requests.

---

# License

MIT License

---

# Enjoy!

If this extension helps you, please consider giving it a ⭐ on GitHub.
If you want to connect visit my [Linkedin](https://www.linkedin.com/in/dudadepauladuarte/)!