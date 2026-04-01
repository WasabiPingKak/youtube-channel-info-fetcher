# utils/route_loader.py
# 自動掃描 routes/ 目錄，找出所有 init_*_route(s) 函式並註冊

import importlib
import inspect
import logging
import pkgutil

from google.cloud import firestore

import routes

logger = logging.getLogger(__name__)


def register_all_routes(app, db: firestore.Client):
    """掃描 routes package 下所有模組，自動呼叫 init_* 函式註冊路由。"""
    registered = []

    for module_info in pkgutil.iter_modules(routes.__path__, prefix="routes."):
        module = importlib.import_module(module_info.name)

        for name, func in inspect.getmembers(module, inspect.isfunction):
            if not name.startswith("init_"):
                continue

            params = inspect.signature(func).parameters
            if "db" in params:
                func(app, db)
            else:
                func(app)

            registered.append(f"{module_info.name}.{name}")

    logger.info("✅ 自動註冊 %d 個路由初始化函式", len(registered))
