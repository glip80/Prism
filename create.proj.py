import os
import json

# Define the complete project structure
project_structure = {
    "modular-dashboard-platform": {
        ".vscode": {
            "settings.json": "",
            "extensions.json": "",
            "launch.json": "",
            "tasks.json": ""
        },
        ".github": {
            "workflows": {
                "ci-cd.yml": "",
                "pr-validation.yml": "",
                "nightly-tests.yml": ""
            }
        },
        "frontend": {
            "src": {
                "components": {
                    "Dashboard": {
                        "DashboardContainer.tsx": "",
                        "GridLayout.tsx": "",
                        "WidgetRenderer.tsx": "",
                        "Toolbar": {
                            "AddWidgetButton.tsx": "",
                            "ThemeSwitcher.tsx": "",
                            "LayoutSelector.tsx": "",
                            "RefreshControls.tsx": ""
                        }
                    },
                    "Widgets": {
                        "BaseWidget.tsx": "",
                        "ChartWidget": {
                            "ChartWidget.tsx": "",
                            "ChartConfig.tsx": ""
                        },
                        "TableWidget": {
                            "TableWidget.tsx": "",
                            "TableConfig.tsx": ""
                        },
                        "MetricWidget": {
                            "MetricWidget.tsx": "",
                            "MetricConfig.tsx": ""
                        }
                    },
                    "Common": {
                        "ThemeProvider.tsx": "",
                        "ErrorBoundary.tsx": "",
                        "PermissionGate.tsx": ""
                    }
                },
                "hooks": {
                    "useLayout.ts": "",
                    "useWidgetData.ts": "",
                    "useTheme.ts": "",
                    "usePermissions.ts": "",
                    "useWebSocket.ts": ""
                },
                "services": {
                    "api": {
                        "client.ts": "",
                        "layoutApi.ts": "",
                        "widgetApi.ts": "",
                        "authApi.ts": ""
                    },
                    "websocket": {
                        "socketClient.ts": ""
                    }
                },
                "stores": {
                    "layoutStore.ts": "",
                    "authStore.ts": "",
                    "themeStore.ts": ""
                },
                "types": {
                    "index.ts": ""
                },
                "utils": {
                    "asyncUtils.ts": "",
                    "validators.ts": ""
                },
                "App.tsx": "",
                "main.tsx": "",
                "index.css": ""
            },
            "tests": {
                "unit": {
                    "components": {
                        "DashboardContainer.test.tsx": "",
                        "WidgetRenderer.test.tsx": ""
                    },
                    "hooks": {
                        "useLayout.test.ts": "",
                        "useTheme.test.ts": ""
                    },
                    "stores": {
                        "layoutStore.test.ts": ""
                    }
                },
                "integration": {
                    "dashboard-flow.test.tsx": "",
                    "widget-data-fetching.test.tsx": "",
                    "theme-switching.test.tsx": ""
                },
                "e2e": {
                    "playwright.config.ts": "",
                    "tests": {
                        "auth.spec.ts": "",
                        "dashboard.spec.ts": "",
                        "widgets.spec.ts": ""
                    }
                },
                "setup.ts": "",
                "mocks": {
                    "handlers.ts": "",
                    "server.ts": ""
                }
            },
            "public": {},
            "package.json": "",
            "tsconfig.json": "",
            "vite.config.ts": "",
            "vitest.config.ts": "",
            "tailwind.config.js": "",
            "Dockerfile": "",
            "nginx.conf": "",
            ".env.example": "",
            ".eslintrc.cjs": "",
            ".prettierrc": ""
        },
        "backend": {
            "shared": {
                "types": {
                    "index.ts": ""
                },
                "utils": {
                    "logger.ts": "",
                    "encryption.ts": "",
                    "validators.ts": ""
                },
                "middleware": {
                    "auth.ts": "",
                    "errorHandler.ts": "",
                    "rateLimiter.ts": ""
                },
                "constants": {
                    "permissions.ts": "",
                    "themes.ts": ""
                }
            },
            "services": {
                "auth-service": {
                    "src": {
                        "controllers": {
                            "authController.ts": "",
                            "userController.ts": ""
                        },
                        "services": {
                            "authService.ts": "",
                            "userService.ts": "",
                            "roleService.ts": ""
                        },
                        "models": {
                            "user.ts": "",
                            "role.ts": "",
                            "organization.ts": ""
                        },
                        "routes": {
                            "auth.ts": "",
                            "users.ts": "",
                            "roles.ts": ""
                        },
                        "database": {
                            "config.ts": "",
                            "migrations": {},
                            "seeds": {}
                        },
                        "tests": {
                            "unit": {
                                "authService.test.ts": "",
                                "userService.test.ts": ""
                            },
                            "integration": {
                                "auth-api.test.ts": "",
                                "user-management.test.ts": ""
                            }
                        },
                        "app.ts": "",
                        "server.ts": ""
                    },
                    "package.json": "",
                    "tsconfig.json": "",
                    "jest.config.js": "",
                    "Dockerfile": "",
                    ".env.example": ""
                },
                "layout-service": {
                    "src": {
                        "controllers": {
                            "layoutController.ts": ""
                        },
                        "services": {
                            "layoutService.ts": "",
                            "versioningService.ts": ""
                        },
                        "models": {
                            "layout.ts": ""
                        },
                        "routes": {
                            "layouts.ts": ""
                        },
                        "database": {
                            "mongo.ts": ""
                        },
                        "tests": {
                            "unit": {
                                "layoutService.test.ts": ""
                            },
                            "integration": {
                                "layout-api.test.ts": ""
                            }
                        },
                        "app.ts": "",
                        "server.ts": ""
                    },
                    "package.json": "",
                    "tsconfig.json": "",
                    "jest.config.js": "",
                    "Dockerfile": "",
                    ".env.example": ""
                },
                "connector-service": {
                    "src": {
                        "adapters": {
                            "postgresAdapter.ts": "",
                            "mysqlAdapter.ts": "",
                            "mongoAdapter.ts": "",
                            "restAdapter.ts": ""
                        },
                        "controllers": {
                            "connectorController.ts": "",
                            "queryController.ts": ""
                        },
                        "services": {
                            "connectionPool.ts": "",
                            "queryExecutor.ts": ""
                        },
                        "tests": {
                            "unit": {
                                "adapters.test.ts": ""
                            },
                            "integration": {
                                "database-connections.test.ts": ""
                            }
                        },
                        "app.ts": "",
                        "server.ts": ""
                    },
                    "package.json": "",
                    "tsconfig.json": "",
                    "jest.config.js": "",
                    "Dockerfile": "",
                    ".env.example": ""
                },
                "widget-service": {
                    "src": {
                        "controllers": {
                            "widgetController.ts": ""
                        },
                        "services": {
                            "widgetService.ts": "",
                            "refreshService.ts": ""
                        },
                        "websocket": {
                            "handler.ts": ""
                        },
                        "tests": {
                            "integration": {
                                "websocket.test.ts": ""
                            }
                        },
                        "app.ts": "",
                        "server.ts": ""
                    },
                    "package.json": "",
                    "tsconfig.json": "",
                    "jest.config.js": "",
                    "Dockerfile": "",
                    ".env.example": ""
                }
            }
        },
        "infrastructure": {
            "docker": {
                "docker-compose.yml": "",
                "docker-compose.prod.yml": "",
                "docker-compose.test.yml": ""
            },
            "k8s": {
                "base": {
                    "namespace.yaml": "",
                    "configmap.yaml": "",
                    "secrets.yaml": ""
                },
                "services": {
                    "auth-deployment.yaml": "",
                    "layout-deployment.yaml": "",
                    "connector-deployment.yaml": "",
                    "widget-deployment.yaml": "",
                    "frontend-deployment.yaml": ""
                },
                "ingress": {
                    "ingress.yaml": ""
                },
                "monitoring": {
                    "prometheus.yaml": "",
                    "grafana.yaml": ""
                }
            },
            "terraform": {
                "main.tf": "",
                "variables.tf": "",
                "outputs.tf": ""
            }
        },
        "docs": {
            "architecture.md": "",
            "api.md": "",
            "deployment.md": ""
        },
        "scripts": {
            "setup.sh": "",
            "test-all.sh": "",
            "deploy.sh": ""
        },
        "Makefile": "",
        "README.md": "",
        ".gitignore": "",
        "docker-compose.yml": ""
    }
}

# Function to create directory structure
def create_structure(base_path, structure):
    for name, content in structure.items():
        path = os.path.join(base_path, name)
        if isinstance(content, dict):
            os.makedirs(path, exist_ok=True)
            create_structure(path, content)
        else:
            os.makedirs(os.path.dirname(path) if os.path.dirname(path) else '.', exist_ok=True)
            with open(path, 'w') as f:
                f.write(content)

# Create the structure
create_structure('.', project_structure)
print("Project structure created successfully!")