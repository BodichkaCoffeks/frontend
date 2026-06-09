function ShowScreen(screen_to_show, screen_to_hide)
{
    if (screen_to_show == 'add-screen')
    {
        document.getElementById('main-screen').classList.add('hiden');
        document.getElementById('action-screen').classList.remove('hiden');
        document.getElementById('input-custom').classList.remove('hiden');
        document.getElementById('text-to-change').innerText = "Додавання артикула";
        document.getElementById('main-action-btn').innerText = "Додати";
    }
    else if (screen_to_show == 'remove-screen')
    {
        document.getElementById('main-screen').classList.add('hiden');
        document.getElementById('action-screen').classList.remove('hiden');
        document.getElementById('text-to-change').innerText = "Видалення артикула";
        document.getElementById('main-action-btn').innerText = "Видалити";
    }
    else if (screen_to_show == 'find-screen')
    {
        document.getElementById('main-screen').classList.add('hiden');
        document.getElementById('action-screen').classList.remove('hiden');
        document.getElementById('text-to-change').innerText = "Пошук артикула";
        document.getElementById('main-action-btn').innerText = "Знайти";
    }
    else if (screen_to_show == 'change-screen')
    {
        document.getElementById('main-screen').classList.add('hiden');
        document.getElementById('action-screen').classList.remove('hiden');
        document.getElementById('input-custom').classList.remove('hiden');
        document.getElementById('input-custom').placeholder = "Введіть новe розташування артикула";
        document.getElementById('text-to-change').innerText = "Редагування артикула";
        document.getElementById('main-action-btn').innerText = "Редагувати";
    }
    else
    {
        if (document.getElementById('input-article').value != "" || document.getElementById('input-custom').value != "")
        {
            document.getElementById('input-article').value = "";
            document.getElementById('input-custom').value = "";
        }
        document.getElementById('input-custom').style.border = "";
        document.getElementById('input-article').style.border = "";
        document.getElementById('input-custom').placeholder = "Введіть розташування артикула";
        document.getElementById('input-article').placeholder = "Введіть назву артикула";
        document.getElementById('action-screen').classList.add('hiden');
        document.getElementById('input-custom').classList.add('hiden');
        document.getElementById('text-answer').classList.add('hiden');
        document.getElementById('main-screen').classList.remove('hiden');
    }
}

function ClearInput()
{
    document.getElementById('input-article').value = "";
    document.getElementById('input-custom').value = "";
}

async function MainAction()
{
    if (document.getElementById('main-action-btn').innerText == "Додати")
    {
        if (IsArticleInputValid() && IsCustomInputValid())
        {
            var response = await fetch("https://entrap-graceless-chloride.ngrok-free.dev/add/article", 
            {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    article: document.getElementById('input-article').value,
                    location: document.getElementById('input-custom').value
                })
            });
            var result = await response.json();
            document.getElementById('text-answer').classList.remove('hiden');
            document.getElementById('text-answer').innerText = result.message;
            ClearInput();
        }
    }
    else if (document.getElementById('main-action-btn').innerText == "Видалити")
    {
        if (IsArticleInputValid())
        {
            var response = await fetch("https://entrap-graceless-chloride.ngrok-free.dev/delete/article", 
            {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    article: document.getElementById('input-article').value,
                })
            });
            var result = await response.json();
            document.getElementById('text-answer').classList.remove('hiden');
            document.getElementById('text-answer').innerText = result.message;
            ClearInput();
        }
    }
    else if (document.getElementById('main-action-btn').innerText == "Знайти")
    {
        if (IsArticleInputValid())
        {
            var response = await fetch("https://entrap-graceless-chloride.ngrok-free.dev/get/article", 
            {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    article: document.getElementById('input-article').value,
                })
            });
            var result = await response.json();
            document.getElementById('text-answer').classList.remove('hiden'); 
            document.getElementById('text-answer').innerText = result.message;
            ClearInput();
        }
    }
    else
    {
        if (IsArticleInputValid() && IsCustomInputValid())
        {
            var response = await fetch("https://entrap-graceless-chloride.ngrok-free.dev/change/article", 
            {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    article: document.getElementById('input-article').value,
                    new_location: document.getElementById('input-custom').value
                })
            });
            var result = await response.json();
            document.getElementById('text-answer').classList.remove('hiden');
            document.getElementById('text-answer').innerText = result.message;
            ClearInput();
        }
    }
}


function IsArticleInputValid()
{
    if (document.getElementById('input-article').value == "")
    {
        document.getElementById('input-article').style.border = "3px solid red";
        document.getElementById('input-article').placeholder= "Це поле є обов'язковим!";
        return false;
    }
    else
    {
        document.getElementById('input-article').style.border = "";
        document.getElementById('input-article').placeholder = "Введіть назву артикула";
        return true;
    }
}

function IsCustomInputValid()
{
    if (document.getElementById('input-custom').value == "")
    {
        document.getElementById('input-custom').style.border = "3px solid red";
        document.getElementById('input-custom').placeholder = "Це поле є обов'язковим!";
        return false;
    }
    else
    {
        document.getElementById('input-custom').style.border = "";
        if (document.getElementById('main-action-btn').innerText == "Редагувати")
        {
            document.getElementById('input-custom').placeholder = "Введіть нове розташування артикула";
        }
        else
        {
            document.getElementById('input-custom').placeholder = "Введіть розташування артикула";
        }
        return true;
    }  
}