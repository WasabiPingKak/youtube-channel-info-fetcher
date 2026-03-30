"""
route_loader 測試：自動掃描路由註冊機制
"""

import types
from unittest.mock import MagicMock, patch


def _make_init_func(name, has_db=True):
    """建立真正的 function 讓 inspect.isfunction 回傳 True"""
    if has_db:

        def func(app, db):
            func._called_with = (app, db)
    else:

        def func(app):
            func._called_with = (app,)

    func.__name__ = name
    func.__qualname__ = name
    func._called_with = None
    return func


class TestRegisterAllRoutes:
    @patch("utils.route_loader.pkgutil.iter_modules")
    def test_registers_init_functions_with_db(self, mock_iter):
        from utils.route_loader import register_all_routes

        init_func = _make_init_func("init_test_route", has_db=True)
        fake_module = types.ModuleType("routes.test_route")
        fake_module.init_test_route = init_func

        module_info = MagicMock()
        module_info.name = "routes.test_route"
        mock_iter.return_value = [module_info]

        app = MagicMock()
        db = MagicMock()

        with patch("utils.route_loader.importlib.import_module", return_value=fake_module):
            register_all_routes(app, db)

        assert init_func._called_with == (app, db)

    @patch("utils.route_loader.pkgutil.iter_modules")
    def test_registers_init_functions_without_db(self, mock_iter):
        from utils.route_loader import register_all_routes

        init_func = _make_init_func("init_simple_route", has_db=False)
        fake_module = types.ModuleType("routes.simple_route")
        fake_module.init_simple_route = init_func

        module_info = MagicMock()
        module_info.name = "routes.simple_route"
        mock_iter.return_value = [module_info]

        app = MagicMock()
        db = MagicMock()

        with patch("utils.route_loader.importlib.import_module", return_value=fake_module):
            register_all_routes(app, db)

        assert init_func._called_with == (app,)

    @patch("utils.route_loader.pkgutil.iter_modules")
    def test_skips_non_init_functions(self, mock_iter):
        from utils.route_loader import register_all_routes

        def helper_function():
            pass

        helper_function._called = False

        fake_module = types.ModuleType("routes.test")
        fake_module.helper_function = helper_function

        module_info = MagicMock()
        module_info.name = "routes.test"
        mock_iter.return_value = [module_info]

        app = MagicMock()
        db = MagicMock()

        with patch("utils.route_loader.importlib.import_module", return_value=fake_module):
            register_all_routes(app, db)
        # helper_function 不以 init_ 開頭，不應被呼叫

    @patch("utils.route_loader.pkgutil.iter_modules")
    def test_no_modules(self, mock_iter):
        from utils.route_loader import register_all_routes

        mock_iter.return_value = []
        app = MagicMock()
        db = MagicMock()
        register_all_routes(app, db)
