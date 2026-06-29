from fastapi.testclient import TestClient

from app.main import app


def test_public_catalog_and_admin_dashboard():
    with TestClient(app) as client:
        health = client.get("/api/health")
        assert health.status_code == 200
        assert health.json()["status"] == "ok"

        products = client.get("/api/products")
        assert products.status_code == 200
        assert len(products.json()) >= 10
        assert products.json()[0]["category"]["name"]

        login = client.post(
            "/api/auth/login",
            json={"email": "admin@novamarket.pe", "password": "Nova2026!"},
        )
        assert login.status_code == 200
        token = login.json()["access_token"]

        dashboard = client.get(
            "/api/admin/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert dashboard.status_code == 200
        body = dashboard.json()
        assert body["metrics"]["orders"] > 0
        assert len(body["sales_by_month"]) == 6

        settings = client.get(
            "/api/admin/settings",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert settings.status_code == 200
        assert settings.json()["store_name"] == "NovaMarket Perú"

        customers = client.get(
            "/api/admin/customers",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert customers.status_code == 200
        assert len(customers.json()) >= 5


def test_invalid_admin_credentials_are_rejected():
    with TestClient(app) as client:
        response = client.post(
            "/api/auth/login",
            json={"email": "admin@novamarket.pe", "password": "incorrecta"},
        )
        assert response.status_code == 401


def test_customer_can_login_and_view_order_history():
    with TestClient(app) as client:
        login = client.post(
            "/api/customer/login",
            json={"email": "ana@example.com", "password": "Cliente2026!"},
        )
        assert login.status_code == 200
        token = login.json()["access_token"]
        assert login.json()["user"]["name"] == "Ana Torres"

        profile = client.get(
            "/api/customer/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert profile.status_code == 200

        orders = client.get(
            "/api/customer/orders",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert orders.status_code == 200
        assert len(orders.json()) >= 1
