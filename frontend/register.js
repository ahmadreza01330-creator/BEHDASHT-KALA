const registerForm =
    document.getElementById("registerForm");

const registerMessage =
    document.getElementById("registerMessage");

const provinceSelect =
    document.getElementById("province");

const citySelect =
    document.getElementById("city");


// ======================================
// ساخت لیست استان‌ها
// ======================================

function loadProvinces() {

    provinceSelect.innerHTML = `
        <option value="">
            انتخاب استان
        </option>
    `;

    Object.keys(IRAN_LOCATIONS)
        .sort((a, b) => a.localeCompare(b, "fa"))
        .forEach(function (province) {

            const option =
                document.createElement("option");

            option.value = province;

            option.textContent = province;

            provinceSelect.appendChild(option);

        });
}


// ======================================
// تغییر استان → تغییر شهر
// ======================================

provinceSelect.addEventListener(
    "change",
    function () {

        const province =
            provinceSelect.value;


        citySelect.innerHTML = `
            <option value="">
                انتخاب شهرستان / شهر
            </option>
        `;


        if (!province) {

            citySelect.disabled = true;

            return;
        }


        const cities =
            IRAN_LOCATIONS[province];


        cities.forEach(function (city) {

            const option =
                document.createElement("option");

            option.value = city;

            option.textContent = city;

            citySelect.appendChild(option);

        });


        citySelect.disabled = false;

    }
);


// ======================================
// فقط عدد برای شماره تلفن
// ======================================

document
    .getElementById("phone")
    .addEventListener(
        "input",
        function () {

            this.value =
                this.value.replace(
                    /[^0-9]/g,
                    ""
                );

        }
    );


// ======================================
// فقط عدد برای کد پستی
// ======================================

document
    .getElementById("postalCode")
    .addEventListener(
        "input",
        function () {

            this.value =
                this.value.replace(
                    /[^0-9]/g,
                    ""
                );

        }
    );


// ======================================
// ثبت نام
// ======================================

registerForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const firstName =
            document
                .getElementById("firstName")
                .value
                .trim();


        const lastName =
            document
                .getElementById("lastName")
                .value
                .trim();


        const phone =
            document
                .getElementById("phone")
                .value
                .trim();


        const storeName =
            document
                .getElementById("storeName")
                .value
                .trim();


        const storeType =
            document
                .getElementById("storeType")
                .value;


        const province =
            document
                .getElementById("province")
                .value;


        const city =
            document
                .getElementById("city")
                .value;


        const address =
            document
                .getElementById("address")
                .value
                .trim();


        const postalCode =
            document
                .getElementById("postalCode")
                .value
                .trim();


        const username =
            document
                .getElementById("username")
                .value
                .trim();


        const password =
            document
                .getElementById("password")
                .value;


        // ==================================
        // بررسی اطلاعات
        // ==================================

        if (
            !firstName ||
            !lastName ||
            !phone ||
            !storeName ||
            !storeType ||
            !province ||
            !city ||
            !address ||
            !postalCode ||
            !username ||
            !password
        ) {

            showMessage(
                "لطفاً تمام فیلدها را کامل کنید.",
                "#ff7b7b"
            );

            return;
        }


        if (phone.length !== 11) {

            showMessage(
                "شماره تلفن باید ۱۱ رقم باشد.",
                "#ff7b7b"
            );

            return;
        }


        if (postalCode.length !== 10) {

            showMessage(
                "کد پستی باید ۱۰ رقم باشد.",
                "#ff7b7b"
            );

            return;
        }


        if (password.length < 6) {

            showMessage(
                "رمز عبور باید حداقل ۶ کاراکتر باشد.",
                "#ff7b7b"
            );

            return;
        }


        // ==================================
        // حالت در حال ثبت
        // ==================================

        showMessage(
            "⏳ در حال ثبت نام...",
            "#72f5d3"
        );


        const submitButton =
            registerForm.querySelector(
                "button[type='submit']"
            );


        submitButton.disabled = true;

        submitButton.style.opacity = "0.6";


        try {

            const response =
                await fetch(
                    "http://localhost:5000/api/register",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            firstName:
                                firstName,

                            lastName:
                                lastName,

                            phone:
                                phone,

                            storeName:
                                storeName,

                            storeType:
                                storeType,

                            province:
                                province,

                            city:
                                city,

                            address:
                                address,

                            postalCode:
                                postalCode,

                            username:
                                username,

                            password:
                                password

                        })

                    }
                );


            const result =
                await response.json();


            console.log(
                "REGISTER RESULT:",
                result
            );


            if (result.success) {

                showMessage(
                    "✅ ثبت نام با موفقیت انجام شد!",
                    "#72f5d3"
                );


                registerForm.reset();


                citySelect.innerHTML = `
                    <option value="">
                        ابتدا استان را انتخاب کنید
                    </option>
                `;

                citySelect.disabled = true;


                setTimeout(
                    function () {

                        window.location.href =
                            "login.html";

                    },
                    1200
                );


            } else {

                showMessage(
                    "❌ " +
                    (
                        result.message ||
                        "ثبت نام انجام نشد."
                    ),
                    "#ff7b7b"
                );

            }


        } catch (error) {

            console.error(
                "REGISTER ERROR:",
                error
            );


            showMessage(
                "❌ اتصال به سرور برقرار نشد. ابتدا backend را اجرا کنید.",
                "#ff7b7b"
            );

        }


        submitButton.disabled = false;

        submitButton.style.opacity = "1";

    }
);


// ======================================
// نمایش پیام
// ======================================

function showMessage(
    message,
    color
) {

    registerMessage.textContent =
        message;

    registerMessage.style.color =
        color;

}


// ======================================
// اجرای اولیه
// ======================================

loadProvinces();