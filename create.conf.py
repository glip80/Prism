import os
import json
vscode_files = {
    ".vscode/settings.json": """{
  "typescript.tsdk": "frontend/node_modules/typescript/lib",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.git": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "eslint.workingDirectories": [
    "frontend",
    "backend/services/auth-service",
    "backend/services/layout-service",
    "backend/services/connector-service",
    "backend/services/widget-service"
  ],
  "jest.disabledWorkspaceFolders": [],
  "jest.autoRun": "off",
  "docker.compose.projectName": "modular-dashboard"
}""",

    ".vscode/extensions.json": """{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "orta.vscode-jest",
    "ms-playwright.playwright",
    "ms-azuretools.vscode-docker",
    "ms-kubernetes-tools.vscode-kubernetes-tools",
    "hashicorp.terraform",
    "github.vscode-github-actions",
    "eamodio.gitlens",
    "usernamehw.errorlens",
    "yoavbls.pretty-ts-errors",
    "ms-vscode.test-adapter-converter",
    "hbenl.vscode-test-explorer"
  ]
}""",

    ".vscode/launch.json": """{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to Auth Service",
      "port": 9229,
      "restart": true,
      "localRoot": "${workspaceFolder}/backend/services/auth-service",
      "remoteRoot": "/app"
    },
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to Layout Service",
      "port": 9230,
      "restart": true,
      "localRoot": "${workspaceFolder}/backend/services/layout-service",
      "remoteRoot": "/app"
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Frontend",
      "url": "http://localhost:80",
      "webRoot": "${workspaceFolder}/frontend",
      "sourceMapPathOverrides": {
        "webpack:///src/*": "${webRoot}/src/*"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Current Test File",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["${relativeFile}", "--coverage=false"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "disableOptimisticBPs": true
    }
  ],
  "compounds": [
    {
      "name": "Debug All Services",
      "configurations": [
        "Attach to Auth Service",
        "Attach to Layout Service"
      ]
    }
  ]
}""",

    ".vscode/tasks.json": """{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Docker Compose Up",
      "type": "shell",
      "command": "docker-compose",
      "args": ["up", "-d", "--build"],
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "problemMatcher": []
    },
    {
      "label": "Docker Compose Down",
      "type": "shell",
      "command": "docker-compose",
      "args": ["down", "-v"],
      "group": "build"
    },
    {
      "label": "Run All Tests",
      "type": "shell",
      "command": "make",
      "args": ["test-all"],
      "group": {
        "kind": "test",
        "isDefault": true
      }
    },
    {
      "label": "Run Frontend Tests",
      "type": "shell",
      "command": "make",
      "args": ["test-frontend"],
      "group": "test"
    },
    {
      "label": "Run E2E Tests",
      "type": "shell",
      "command": "make",
      "args": ["test-e2e"],
      "group": "test"
    },
    {
      "label": "Install Dependencies",
      "type": "shell",
      "command": "make",
      "args": ["install"],
      "group": "build"
    },
    {
      "label": "Lint All",
      "type": "shell",
      "command": "make",
      "args": ["lint"],
      "group": "build"
    }
  ]
}"""
}

# Write VS Code files
for filename, content in vscode_files.items():
    filepath = f"modular-dashboard-platform/{filename}"
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w') as f:
        f.write(content)

print("VS Code configuration files created!")