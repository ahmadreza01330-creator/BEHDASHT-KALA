const registerForm = document.getElementById("registerForm");

const message = document.getElementById("message");

registerForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    const data = {

        firstName:
            document.getElementById("firstName").value.trim(),

        lastName:
            document.getElementById("lastName").value.trim(),

        phone:
            document.getElementById("phone").value.trim(),

        storeName:
            document.getElementById("storeName").value.trim(),

        storeType:
            document.getElementById("storeType").value,

        province:
            document.getElementById("province").value.trim(),

        city:
            document.getElementById("city").value.trim(),

        address:
            document.getElementById("address").value.trim(),

        postalCode:
            document.getElementById("postalCode").value.trim(),

        username:
            document.getElementById("username").value.trim(),

        password:
            document.getElementById("password").value
    };


    message.textContent = "در حال ثبت نام...";


    try {

        const response = await fetch(
            "/api/register",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)
            }
        );


        const result = await response.json();


        if (result.success) {

            message.textContent =
                "✅ " + result.message;

            message.style.color = "#72f5d3";

            registerForm.reset();

        } else {

            message.textContent =
                "❌ " + result.message;

            message.style.color = "#ff7b7b";
        }


    } catch (error) {

        console.error(error);

        message.textContent =
            "❌ ارتباط با سرور برقرار نشد.";

        message.style.color = "#ff7b7b";
    }

});