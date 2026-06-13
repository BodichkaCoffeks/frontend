function ShowScreen(screen_to_show)
{
    if (screen_to_show == 'main-screen')
    {
        document.getElementById('main-selection').value = "none";
        document.getElementById('main-selection').style.border = "";
        document.getElementById('text-answer').innerHTML = "";
        document.getElementById('input-article').value = "";
        document.getElementById('input-article').style.border = "";
        document.getElementById('input-article').placeholder = "Введіть назву артикула";
        document.getElementById('main-screen').classList.remove('hiden');
        document.getElementById('action-screen').classList.add('hiden');
        document.getElementById('main-selection').classList.add('hiden');
        document.getElementById('box-selection').classList.add('hiden');
        document.getElementById('rack-selection').classList.add('hiden');
        document.getElementById('floor-selection').classList.add('hiden');
    }
    else
    {
        document.getElementById('main-screen').classList.add('hiden');
        document.getElementById('action-screen').classList.remove('hiden');
        switch (screen_to_show)
        {
            case 'add-screen':
                document.getElementById('text-to-change').innerText = "Додавання артикула";
                document.getElementById('main-action-btn').innerText = "Додати";
                document.getElementById('main-selection').classList.remove('hiden');
                break;
            case 'remove-screen':
                document.getElementById('text-to-change').innerText = "Видалення артикула";
                document.getElementById('main-action-btn').innerText = "Видалити";
                break;
            case 'find-screen':
                document.getElementById('text-to-change').innerText = "Пошук артикула";
                document.getElementById('main-action-btn').innerText = "Знайти";
                break;
            case 'change-screen':
                document.getElementById('text-to-change').innerText = "Редагування артикула";
                document.getElementById('main-action-btn').innerText = "Редагувати";
                document.getElementById('main-selection').classList.remove('hiden');
                break;
            default:
                break;
        }
    }
}

async function MainAction()
{
    var main_input = document.getElementById('main-selection').value;
    var article = document.getElementById('input-article').value;
    switch (document.getElementById('main-action-btn').innerText)
    {
        case "Додати":
            action = "/add/article";
            break;
        case "Редагувати":
            action = "/change/article";
            break;
        case "Видалити":
            action = "/delete/article";
            break;
        case "Знайти":
            action = "/get/article";
            break;
        default:
            break;
    }
    if (document.getElementById('main-action-btn').innerText == "Додати" || document.getElementById('main-action-btn').innerText == "Редагувати")
    {
        if (IsArticleAndSelectionValid())
        {
            if (main_input == 'Стелаж праворуч' || main_input == 'Стелаж ліворуч')
            {
                var yarus_data = document.getElementById('rack-selection').value;
                var floor_data = document.getElementById('floor-selection').value;
                var response = await fetch(`https://entrap-graceless-chloride.ngrok-free.dev${action}`, 
                {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        article: article,
                        location: main_input + " " + yarus_data + " " + floor_data,
                    })
                });
                var result = await response.json();
                document.getElementById('text-answer').classList.remove('hiden');
                document.getElementById('text-answer').innerHTML = result.message;
                ClearInput();
            }
            else if (main_input == 'Ящик праворуч' || main_input == 'Ящик ліворуч')
            { 
                var box_data = document.getElementById('box-selection').value;
                var response = await fetch(`https://entrap-graceless-chloride.ngrok-free.dev${action}`, 
                {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        article: article,
                        location: main_input + " " + box_data,
                    })
                });
                var result = await response.json();
                document.getElementById('text-answer').classList.remove('hiden');
                document.getElementById('text-answer').innerHTML = result.message;
                ClearInput();
            }
            else
            {
                var response = await fetch(`https://entrap-graceless-chloride.ngrok-free.dev${action}`, 
                {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        article: article,
                        location: main_input,
                    })
                });
                var result = await response.json();
                document.getElementById('text-answer').classList.remove('hiden');
                document.getElementById('text-answer').innerHTML = result.message;
                ClearInput();
            }
        }
    }
    else
    {
        if (IsArticleValid())
        {
            var response = await fetch(`https://entrap-graceless-chloride.ngrok-free.dev${action}`,
            {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    article: article,
                })
            });
            var result = await response.json();
            document.getElementById('text-answer').classList.remove('hiden');
            document.getElementById('text-answer').innerHTML = result.message;
            ClearInput();
        }
    }
}


function IsArticleValid()
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
        document.getElementById('main-selection').style.border = "";
        return true;
    }
}

function IsArticleAndSelectionValid()
{
    if (document.getElementById('input-article').value == "")
    {
        document.getElementById('input-article').style.border = "3px solid red";
        document.getElementById('input-article').placeholder= "Це поле є обов'язковим!";
        return false;
    }
    else if (document.getElementById('main-selection').value == "none")
    {
        document.getElementById('input-article').style.border = "";
        document.getElementById('input-article').placeholder = "Введіть назву артикула";
        document.getElementById('main-selection').style.border = "3px solid red";
        return false;
    }
    else
    {
        document.getElementById('input-article').style.border = "";
        document.getElementById('input-article').placeholder = "Введіть назву артикула";
        document.getElementById('main-selection').style.border = "";
        return true;
    }
}





function ClearInput()
{
    document.getElementById('input-article').value = "";
}





function MainListener()
{
    var choice = document.getElementById('main-selection').value;
    if (choice == 'Ящик праворуч' || choice == 'Ящик ліворуч')
    {
        document.getElementById('box-selection').classList.remove('hiden');
        document.getElementById('rack-selection').classList.add('hiden');
    }
    else if (choice == 'Стелаж праворуч')
    { 
        document.getElementById('floor-selection').classList.remove('hiden');
        document.getElementById('rack-selection').classList.remove('hiden');
        document.getElementById('specifical-rack').classList.remove('hiden');
        document.getElementById('box-selection').classList.add('hiden');
    }
    else if (choice == 'Стелаж ліворуч')
    {
        document.getElementById('floor-selection').classList.remove('hiden');
        document.getElementById('rack-selection').classList.remove('hiden');
        document.getElementById('specifical-rack').classList.add('hiden');
        document.getElementById('box-selection').classList.add('hiden');
    }
    else
    {
        document.getElementById('floor-selection').classList.add('hiden');
        document.getElementById('box-selection').classList.add('hiden');
        document.getElementById('rack-selection').classList.add('hiden');
    }
}


document.getElementById('main-selection').addEventListener('change', MainListener);