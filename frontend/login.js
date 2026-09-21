const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("message");

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const username = document
        .getElementById("username")
        .value
        .trim();

    const password = document
        .getElementById("password")
        .value;

    if (!username || !password) {

        loginMessage.textContent =
            "لطفاً نام کاربری و رمز عبور را وارد کنید.";

        loginMessage.className = "error";

        return;
    }

    loginMessage.textContent = "در حال ورود...";
    loginMessage.className = "success";

    try {

        const response = await fetch(
            "http://localhost:5000/api/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    username: username,
                    password: password
                })
            }
        );

        const result = await response.json();

        console.log("LOGIN RESULT:", result);

        // اگر ورود ناموفق بود
        if (!response.ok) {

            loginMessage.textContent =
                "❌ " + (result.message || "نام کاربری یا رمز عبور اشتباه است.");

            loginMessage.className = "error";

            return;
        }

        // بررسی وجود توکن
        if (!result.token) {

            loginMessage.textContent =
                "❌ توکن ورود از سرور دریافت نشد.";

            loginMessage.className = "error";

            console.error("TOKEN NOT FOUND:", result);

            return;
        }

        // ذخیره توکن
        localStorage.setItem(
            "token",
            result.token
        );

        // ذخیره اطلاعات فروشنده
        if (result.seller) {

            localStorage.setItem(
                "seller",
                JSON.stringify(result.seller)
            );

        }

        loginMessage.textContent =
            "✅ ورود موفقیت‌آمیز بود";

        loginMessage.className = "success";

        console.log("TOKEN SAVED:", result.token);

        // انتقال به داشبورد
        setTimeout(function () {

            window.location.href = "dashboard.html";

        }, 500);

    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        loginMessage.textContent =
            "❌ اتصال به سرور برقرار نشد.";

        loginMessage.className = "error";
    }

});