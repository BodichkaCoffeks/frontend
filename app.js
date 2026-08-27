let videoStream = null;
let isScanRequestInFlight = false;

const BACKEND_URL = "https://entrap-graceless-chloride.ngrok-free.dev";

const GEMINI_SCAN_ENDPOINT = `${BACKEND_URL}/gemini/scan`;
const MIN_CONFIDENCE = 0.55;
const GEMINI_REQUEST_TIMEOUT_MS = 65000;

function ShowScreen(screen_to_show) {
    StopScanner();
    HideLoader();
    HideScanActions();
    ResetLocationFields();
    ClearFieldError(document.getElementById('input-article'));
    document.getElementById('input-article').placeholder = "Введіть назву артикула";

    if (screen_to_show === 'main-screen') {
        document.getElementById('text-answer').innerHTML = "";
        document.getElementById('text-answer').classList.add('hiden');
        document.getElementById('input-article').value = "";
        document.getElementById('main-screen').classList.remove('hiden');
        document.getElementById('action-screen').classList.add('hiden');
        document.getElementById('main-selection').classList.add('hiden');
        HideLocationSubmenus();
    } else {
        document.getElementById('main-screen').classList.add('hiden');
        document.getElementById('action-screen').classList.remove('hiden');
        switch (screen_to_show) {
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
                ShowScanActions();
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

function ShowScanActions() {
    const scanActions = document.getElementById('scan-actions');
    if (scanActions) {
        scanActions.classList.remove('hiden');
    }
}

function HideScanActions() {
    const scanActions = document.getElementById('scan-actions');
    if (scanActions) {
        scanActions.classList.add('hiden');
    }
}

function HideLocationSubmenus() {
    document.getElementById('box-selection').classList.add('hiden');
    document.getElementById('rack-selection').classList.add('hiden');
    document.getElementById('floor-selection').classList.add('hiden');
}

function ResetLocationFields() {
    const mainSelection = document.getElementById('main-selection');
    const boxSelection = document.getElementById('box-selection');
    const rackSelection = document.getElementById('rack-selection');
    const floorSelection = document.getElementById('floor-selection');

    mainSelection.value = "none";
    boxSelection.value = "none";
    rackSelection.value = "none";
    floorSelection.value = "none";

    ClearFieldError(mainSelection);
    ClearFieldError(boxSelection);
    ClearFieldError(rackSelection);
    ClearFieldError(floorSelection);
    HideLocationSubmenus();
    SetRackSectionLimit(3);
}

function SetFieldError(element) {
    if (!element) return;
    element.classList.add('invalid');
}

function ClearFieldError(element) {
    if (!element) return;
    element.classList.remove('invalid');
}

function SetRackSectionLimit(maxSections) {
    const rackSelection = document.getElementById('rack-selection');
    const thirdSection = document.getElementById('specifical-rack');
    const allowThird = maxSections >= 3;

    if (thirdSection) {
        thirdSection.hidden = !allowThird;
        thirdSection.disabled = !allowThird;
        thirdSection.classList.toggle('hiden', !allowThird);
    }

    if (!allowThird && rackSelection.value === "3 секція") {
        rackSelection.value = "none";
    }
}

async function MainAction() {
    var main_input = document.getElementById('main-selection').value;
    var article = document.getElementById('input-article').value.trim();
    var action_type = document.getElementById('main-action-btn').innerText;
    var action = "";
    
    switch (action_type) {
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
    
    if (action_type === "Додати" || action_type === "Редагувати") {
        if (IsArticleAndSelectionValid()) {
            const locationStr = BuildLocationString(main_input);

            try {
                var response = await fetch(`${BACKEND_URL}${action}`, {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        article: article,
                        location: locationStr
                    })
                });
                var result = await response.json();
                document.getElementById('text-answer').classList.remove('hiden');
                document.getElementById('text-answer').innerHTML = result.message || "Операцію виконано";
                ClearInput();
            } catch (err) {
                console.error(err);
                document.getElementById('text-answer').classList.remove('hiden');
                document.getElementById('text-answer').innerHTML = "Помилка з'єднання з сервером";
            }
        }
    } else {
        if (IsArticleValid()) {
            try {
                var response = await fetch(`${BACKEND_URL}${action}`, {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ article: article })
                });
                var result = await response.json();
                document.getElementById('text-answer').classList.remove('hiden');
                document.getElementById('text-answer').innerHTML = result.message || "Операцію виконано";
                ClearInput();
            } catch (err) {
                console.error(err);
                document.getElementById('text-answer').classList.remove('hiden');
                document.getElementById('text-answer').innerHTML = "Помилка з'єднання з сервером";
            }
        }
    }
}

function BuildLocationString(mainInput) {
    if (mainInput === "Стелаж праворуч" || mainInput === "Стелаж ліворуч") {
        return `${mainInput} ${document.getElementById("rack-selection").value} ${document.getElementById("floor-selection").value}`;
    }
    if (mainInput === "Ящик праворуч" || mainInput === "Ящик ліворуч") {
        return `${mainInput} ${document.getElementById("box-selection").value}`;
    }
    return mainInput;
}

function IsLocationRuleValid(mainInput) {
    if (mainInput === "none") {
        return false;
    }
    if (mainInput === "Ящик праворуч" || mainInput === "Ящик ліворуч") {
        const boxVal = document.getElementById("box-selection").value;
        return ["Початок складу", "Середина складу", "Кінець складу"].includes(boxVal);
    }
    if (mainInput === "Стелаж праворуч") {
        const section = document.getElementById("rack-selection").value;
        const floor = document.getElementById("floor-selection").value;
        return ["1 секція", "2 секція", "3 секція"].includes(section) && floor !== "none";
    }
    if (mainInput === "Стелаж ліворуч") {
        const section = document.getElementById("rack-selection").value;
        const floor = document.getElementById("floor-selection").value;
        return ["1 секція", "2 секція"].includes(section) && floor !== "none";
    }
    return mainInput === "Ящик позаду" || mainInput === "На даху" || mainInput === "Одинички";
}

function IsArticleValid() {
    const articleInput = document.getElementById('input-article');
    if (articleInput.value.trim() === "") {
        SetFieldError(articleInput);
        articleInput.placeholder = "Це поле є обов'язковим!";
        return false;
    }
    ClearFieldError(articleInput);
    articleInput.placeholder = "Введіть назву артикула";
    ClearFieldError(document.getElementById('main-selection'));
    return true;
}

function IsArticleAndSelectionValid() {
    const articleInput = document.getElementById('input-article');
    const mainSelection = document.getElementById('main-selection');
    const boxSelection = document.getElementById('box-selection');
    const rackSelection = document.getElementById('rack-selection');
    const floorSelection = document.getElementById('floor-selection');
    const mainInput = mainSelection.value;

    ClearFieldError(articleInput);
    ClearFieldError(mainSelection);
    ClearFieldError(boxSelection);
    ClearFieldError(rackSelection);
    ClearFieldError(floorSelection);
    articleInput.placeholder = "Введіть назву артикула";

    if (articleInput.value.trim() === "") {
        SetFieldError(articleInput);
        articleInput.placeholder = "Це поле є обов'язковим!";
        return false;
    }

    if (mainInput === "none") {
        SetFieldError(mainSelection);
        return false;
    }

    if ((mainInput === "Ящик праворуч" || mainInput === "Ящик ліворуч") && boxSelection.value === "none") {
        SetFieldError(boxSelection);
        return false;
    }

    if (mainInput === "Стелаж праворуч" || mainInput === "Стелаж ліворуч") {
        const allowedSections = mainInput === "Стелаж праворуч"
            ? ["1 секція", "2 секція", "3 секція"]
            : ["1 секція", "2 секція"];
        if (!allowedSections.includes(rackSelection.value)) {
            SetFieldError(rackSelection);
            return false;
        }
        if (floorSelection.value === "none") {
            SetFieldError(floorSelection);
            return false;
        }
    }

    return IsLocationRuleValid(mainInput);
}

function ClearInput() {
    document.getElementById('input-article').value = "";
}

function MainListener() {
    const choice = document.getElementById('main-selection').value;
    const boxSelection = document.getElementById('box-selection');
    const rackSelection = document.getElementById('rack-selection');
    const floorSelection = document.getElementById('floor-selection');

    ClearFieldError(document.getElementById('main-selection'));
    ClearFieldError(boxSelection);
    ClearFieldError(rackSelection);
    ClearFieldError(floorSelection);
    HideLocationSubmenus();

    if (choice === "Ящик праворуч" || choice === "Ящик ліворуч") {
        boxSelection.classList.remove('hiden');
        rackSelection.value = "none";
        floorSelection.value = "none";
        return;
    }

    if (choice === "Стелаж праворуч" || choice === "Стелаж ліворуч") {
        const maxSections = choice === "Стелаж праворуч" ? 3 : 2;
        SetRackSectionLimit(maxSections);
        rackSelection.classList.remove('hiden');
        floorSelection.classList.remove('hiden');
        boxSelection.value = "none";
        return;
    }

    boxSelection.value = "none";
    rackSelection.value = "none";
    floorSelection.value = "none";
}

document.getElementById('main-selection').addEventListener('change', MainListener);
document.getElementById('box-selection').addEventListener('change', () => {
    ClearFieldError(document.getElementById('box-selection'));
});
document.getElementById('rack-selection').addEventListener('change', () => {
    ClearFieldError(document.getElementById('rack-selection'));
});
document.getElementById('floor-selection').addEventListener('change', () => {
    ClearFieldError(document.getElementById('floor-selection'));
});

function GetCameraErrorMessage(error) {
    const name = error && error.name ? error.name : "";
    console.error("Camera error:", error);

    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        return "Доступ до камери заборонено. Дозвольте камеру в налаштуваннях браузера.";
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        return "Камера не знайдена на цьому пристрої.";
    }
    if (name === "NotReadableError" || name === "TrackStartError") {
        return "Камера вже використовується іншою програмою або вкладкою.";
    }
    if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
        return "Камера не підтримує потрібні параметри. Спробуйте ще раз.";
    }
    if (name === "SecurityError") {
        return "Камера недоступна через обмеження безпеки (потрібен HTTPS).";
    }
    if (!window.isSecureContext && location.hostname !== "localhost") {
        return "Камера доступна лише через HTTPS або localhost.";
    }
    return "Камера недоступна. Перевірте дозволи та спробуйте ще раз.";
}

function SetCameraStatus(text, type) {
    const statusEl = document.getElementById('camera-status');
    const hintEl = document.getElementById('camera-hint');
    if (!statusEl) return;

    statusEl.classList.remove('camera-status-error', 'camera-status-ok', 'camera-status-busy');
    if (!text) {
        statusEl.textContent = "";
        statusEl.classList.add('hiden');
        if (hintEl) hintEl.classList.remove('hiden');
        return;
    }

    statusEl.textContent = text;
    statusEl.classList.remove('hiden');
    if (type) statusEl.classList.add(`camera-status-${type}`);
    if (hintEl && type !== "busy") hintEl.classList.add('hiden');
}

function SetCameraUiState(state) {
    const captureBtn = document.getElementById('capture-btn');
    const retryBtn = document.getElementById('retry-scan-btn');
    const cancelBtn = document.getElementById('cancel-camera-btn');
    const uploadBtn = document.getElementById('camera-upload-btn');
    const hintEl = document.getElementById('camera-hint');
    const controlsEl = document.querySelector('.camera-controls');
    const overlayEl = document.querySelector('.camera-overlay');
    const processingEl = document.getElementById('camera-processing');

    if (captureBtn) {
        captureBtn.disabled = state === "processing";
        if (state === "retry" || state === "processing") {
            captureBtn.classList.add('hiden');
        } else {
            captureBtn.classList.remove('hiden');
        }
    }

    if (uploadBtn) {
        uploadBtn.disabled = state === "processing";
        if (state === "processing") {
            uploadBtn.classList.add('hiden');
        } else {
            uploadBtn.classList.remove('hiden');
        }
    }

    if (retryBtn) {
        if (state === "retry") {
            retryBtn.classList.remove('hiden');
        } else {
            retryBtn.classList.add('hiden');
        }
    }

    if (cancelBtn) {
        cancelBtn.disabled = false;
        cancelBtn.classList.remove('hiden');
    }

    if (controlsEl) {
        if (state === "processing") {
            controlsEl.classList.add('hiden');
        } else {
            controlsEl.classList.remove('hiden');
        }
    }

    if (overlayEl) {
        if (state === "processing") {
            overlayEl.classList.add('hiden');
        } else {
            overlayEl.classList.remove('hiden');
        }
    }

    if (processingEl) {
        if (state === "processing") {
            processingEl.classList.remove('hiden');
        } else {
            processingEl.classList.add('hiden');
        }
    }

    if (hintEl && state === "ready") {
        hintEl.classList.remove('hiden');
    }
}

function ClearFrozenPreview() {
    const freeze = document.getElementById('camera-freeze');
    const video = document.getElementById('camera-video');
    const processingEl = document.getElementById('camera-processing');

    if (freeze) {
        freeze.classList.add('hiden');
        const ctx = freeze.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, freeze.width, freeze.height);
    }
    if (video) {
        video.classList.remove('hiden');
    }
    if (processingEl) {
        processingEl.classList.add('hiden');
    }
}

function FreezeCapturedPreview(video) {
    const freeze = document.getElementById('camera-freeze');
    if (!freeze || !video.videoWidth || !video.videoHeight) return;

    freeze.width = video.videoWidth;
    freeze.height = video.videoHeight;
    const ctx = freeze.getContext("2d");
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    freeze.classList.remove('hiden');
    video.pause();
    video.classList.add('hiden');
}

function StopCameraTracks() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }

    const video = document.getElementById('camera-video');
    if (video) video.srcObject = null;
}

function ResetCameraUi() {
    isScanRequestInFlight = false;
    SetCameraStatus("", null);
    SetCameraUiState("ready");
    const processingText = document.querySelector('.camera-processing-text');
    if (processingText) {
        processingText.innerHTML = "Рахунок зафіксовано.<br>Розпізнавання всіх артикулів...";
    }
}

async function StartTextScanner() {
    const cameraContainer = document.getElementById('camera-container');
    const textAnswer = document.getElementById('text-answer');
    const video = document.getElementById('camera-video');

    HideLoader();
    textAnswer.classList.add('hiden');
    ClearFrozenPreview();
    ResetCameraUi();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Камера недоступна в цьому браузері.");
        return;
    }

    try {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            videoStream = null;
        }

        const preferredConstraints = {
            video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        };

        try {
            videoStream = await navigator.mediaDevices.getUserMedia(preferredConstraints);
        } catch (preferredError) {
            console.error("Preferred camera constraints failed, falling back:", preferredError);
            videoStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: "environment" } },
                audio: false
            });
        }

        video.srcObject = videoStream;
        video.setAttribute("playsinline", "true");
        video.muted = true;
        await video.play();

        cameraContainer.classList.remove('hiden');
        document.body.classList.add('camera-open');
        HideScanActions();
        SetCameraUiState("ready");
        SetCameraStatus("", null);
    } catch (error) {
        alert(GetCameraErrorMessage(error));
    }
}

function GetScanFrameCrop(video, frameEl) {
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    if (!videoWidth || !videoHeight) return null;

    const videoRect = video.getBoundingClientRect();
    const frameRect = frameEl.getBoundingClientRect();
    if (videoRect.width <= 0 || videoRect.height <= 0) return null;

    const scale = Math.max(videoRect.width / videoWidth, videoRect.height / videoHeight);
    const renderedWidth = videoWidth * scale;
    const renderedHeight = videoHeight * scale;
    const offsetX = (renderedWidth - videoRect.width) / 2;
    const offsetY = (renderedHeight - videoRect.height) / 2;

    let cropX = (frameRect.left - videoRect.left + offsetX) / scale;
    let cropY = (frameRect.top - videoRect.top + offsetY) / scale;
    let cropW = frameRect.width / scale;
    let cropH = frameRect.height / scale;

    cropX = Math.max(0, Math.min(cropX, videoWidth));
    cropY = Math.max(0, Math.min(cropY, videoHeight));
    cropW = Math.max(1, Math.min(cropW, videoWidth - cropX));
    cropH = Math.max(1, Math.min(cropH, videoHeight - cropY));

    const padX = Math.round(cropW * 0.12);
    const padY = Math.round(cropH * 0.18);
    cropX = Math.max(0, cropX - padX);
    cropY = Math.max(0, cropY - padY);
    cropW = Math.min(videoWidth - cropX, cropW + padX * 2);
    cropH = Math.min(videoHeight - cropY, cropH + padY * 2);

    return {
        x: Math.floor(cropX),
        y: Math.floor(cropY),
        width: Math.floor(cropW),
        height: Math.floor(cropH)
    };
}

function CaptureCroppedFrameBlob(video, crop) {
    const maxOutputWidth = 2200;
    const scale = crop.width > maxOutputWidth ? maxOutputWidth / crop.width : 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(crop.width * scale));
    canvas.height = Math.max(1, Math.round(crop.height * scale));

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
        video,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        canvas.width,
        canvas.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Failed to create JPEG blob from canvas"));
                return;
            }
            resolve(blob);
        }, "image/jpeg", 0.95);
    });
}

function LooksLikePrice(value) {
    const token = String(value || "").trim().replace(/\u00A0/g, " ");
    if (/(грн|uah|usd|eur|pln|zł|₴|\$|€)/i.test(token)) return true;
    const compact = token.replace(/\s+/g, "");
    return /^(?:\d{1,3}(?:\d{3})+|\d+)(?:[.,]\d{2})$/.test(compact);
}

function NormalizeRecognizedArticle(rawArticle) {
    if (rawArticle === null || rawArticle === undefined) return null;

    const original = String(rawArticle).trim();
    if (!original || LooksLikePrice(original)) return null;

    let cleaned = original.toUpperCase();
    const charMap = {
        "О": "O", "А": "A", "В": "B", "Е": "E", "К": "K",
        "М": "M", "Н": "H", "Р": "P", "С": "C", "Т": "T",
        "Х": "X", "І": "I", "Ї": "I"
    };
    cleaned = cleaned.replace(/[ОАВЕКМНРСТХІЇ]/g, (ch) => charMap[ch] || ch);
    cleaned = cleaned.replace(/\s+/g, "");
    cleaned = cleaned.replace(/[^A-ZА-ЯІЇЄҐ0-9+\-/.#*_]/g, "");

    if (!cleaned || LooksLikePrice(cleaned)) return null;
    if (cleaned.length < 2 || cleaned.length > 40) return null;

    return cleaned;
}

function CollectRecognizedArticles(data) {
    const rawList = [];
    if (Array.isArray(data && data.articles)) rawList.push(...data.articles);
    if (data && data.article) rawList.push(data.article);

    const seen = new Set();
    const articles = [];
    rawList.forEach((item) => {
        const article = NormalizeRecognizedArticle(item);
        if (!article || seen.has(article)) return;
        seen.add(article);
        articles.push(article);
    });
    return articles;
}

function ValidateGeminiScanResult(data) {
    if (!data || typeof data !== "object") {
        return { ok: false, reason: "invalid-json", message: "Gemini повернув некоректний JSON." };
    }

    const articles = CollectRecognizedArticles(data);
    if (data.success === true && articles.length) {
        const confidence = Number(data.confidence);
        const hasServerMessage = typeof data.message === "string" && data.message.trim();
        if (
            !hasServerMessage &&
            (!Number.isFinite(confidence) || confidence < MIN_CONFIDENCE)
        ) {
            return {
                ok: false,
                reason: "low-confidence",
                message: "Не вдалося впевнено розпізнати артикули. Спробуйте сфотографувати рахунок ще раз."
            };
        }

        return {
            ok: true,
            articles,
            article: articles[0],
            confidence: Number.isFinite(confidence) ? confidence : 1,
            message: data.message || ""
        };
    }

    if (data.success !== true) {
        return { ok: false, reason: "not-recognized", message: "Артикули на фото не вдалося розпізнати." };
    }

    return { ok: false, reason: "null-article", message: "Артикули на фото не вдалося розпізнати." };
}

function GetGeminiHttpErrorMessage(status) {
    if (status === 400) return "Некоректний запит до Gemini. Спробуйте зробити нове фото.";
    if (status === 401) return "Неправильний API key Gemini. Перевірте ключ на backend.";
    if (status === 403) return "Доступ до Gemini API заборонено.";
    if (status === 429) return "Забагато запитів до Gemini. Зачекайте і спробуйте ще раз.";
    if (status >= 500) return "Gemini API тимчасово недоступний. Спробуйте пізніше.";
    return "Помилка Gemini API. Спробуйте ще раз.";
}

async function SendFrameToGemini(blob) {
    const formData = new FormData();
    formData.append("file", blob, blob.name || "scan.jpg");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(GEMINI_SCAN_ENDPOINT, {
            method: "POST",
            body: formData,
            signal: controller.signal
        });

        let payload = null;
        try {
            payload = await response.json();
        } catch (parseError) {
            console.error("Gemini proxy returned non-JSON:", parseError);
            payload = null;
        }

        if (!response.ok) {
            const messageFromServer = payload && (payload.message || payload.error);
            const error = new Error(messageFromServer || GetGeminiHttpErrorMessage(response.status));
            error.status = response.status;
            error.payload = payload;
            throw error;
        }

        if (!payload) {
            const error = new Error("Відсутня відповідь від Gemini.");
            error.status = response.status;
            throw error;
        }

        return payload;
    } catch (error) {
        if (error.name === "AbortError") {
            const timeoutError = new Error("Час очікування Gemini вичерпано. Спробуйте ще раз.");
            timeoutError.status = 408;
            throw timeoutError;
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

function ShowScanRetry(message) {
    const processingEl = document.getElementById('camera-processing');
    if (processingEl) processingEl.classList.add('hiden');
    SetCameraStatus(message, "error");
    SetCameraUiState("retry");
    isScanRequestInFlight = false;
}

async function CaptureAndScanFrame() {
    const video = document.getElementById('camera-video');
    const frameEl = document.getElementById('scanner-frame');
    const captureBtn = document.getElementById('capture-btn');

    if (isScanRequestInFlight) return;

    if (!video || !video.srcObject || !video.videoWidth || !video.videoHeight) {
        alert("Камера ще не готова!");
        return;
    }

    const crop = GetScanFrameCrop(video, frameEl);
    if (!crop) {
        alert("Не вдалося визначити зону сканування. Спробуйте ще раз.");
        return;
    }

    isScanRequestInFlight = true;
    if (captureBtn) captureBtn.disabled = true;

    try {
        const blob = await CaptureCroppedFrameBlob(video, crop);
        FreezeCapturedPreview(video);
        StopCameraTracks();
        SetCameraUiState("processing");
        SetCameraStatus("", null);

        const geminiResult = await SendFrameToGemini(blob);
        const validated = ValidateGeminiScanResult(geminiResult);

        if (!validated.ok) {
            console.error("Gemini validation failed:", validated, geminiResult);
            ShowScanRetry(validated.message);
            return;
        }

        SetCameraStatus(`Розпізнано артикулів: ${validated.articles.length}`, "ok");
        document.getElementById('input-article').value = validated.articles.join(", ");
        ClearFieldError(document.getElementById('input-article'));

        if (validated.message) {
            const textAnswer = document.getElementById('text-answer');
            textAnswer.classList.remove('hiden');
            textAnswer.innerHTML = validated.message;
            StopScanner();
            return;
        }

        ShowLoader("Перевірка в базі...");
        await CheckArticlesOnBackend(validated.articles);
        StopScanner();
    } catch (error) {
        console.error("Scan / Gemini error:", error);
        ShowScanRetry(GetScanErrorMessage(error));
    }
}

function RetryScanCapture() {
    ClearFrozenPreview();
    ResetCameraUi();
    StartTextScanner();
}

function StopScanner() {
    StopCameraTracks();
    ClearFrozenPreview();

    const cameraContainer = document.getElementById('camera-container');
    if (cameraContainer) cameraContainer.classList.add('hiden');
    document.body.classList.remove('camera-open');
    ResetCameraUi();

    if (IsFindScreenActive()) {
        ShowScanActions();
    }
}

function IsFindScreenActive() {
    const actionScreen = document.getElementById('action-screen');
    const title = document.getElementById('text-to-change');
    return Boolean(
        actionScreen &&
        title &&
        !actionScreen.classList.contains('hiden') &&
        title.innerText === "Пошук артикула"
    );
}

function TriggerScreenshotPicker() {
    const input = document.getElementById('screenshot-input');
    if (!input) return;
    input.value = "";
    input.click();
}

async function HandleScreenshotSelected(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type || !file.type.startsWith("image/")) {
        alert("Оберіть зображення скриншота рахунка.");
        return;
    }
    await ScanUploadedScreenshot(file);
}

async function ScanUploadedScreenshot(file) {
    if (isScanRequestInFlight) return;

    isScanRequestInFlight = true;
    const cameraWasOpen = document.body.classList.contains('camera-open');

    try {
        if (cameraWasOpen) {
            StopCameraTracks();
            ClearFrozenPreview();
            SetCameraUiState("processing");
            SetCameraStatus("", null);
            const processingText = document.querySelector('.camera-processing-text');
            if (processingText) {
                processingText.innerHTML = "Скриншот завантажено.<br>Розпізнавання всіх артикулів...";
            }
        } else {
            HideLoader();
            document.getElementById('text-answer').classList.add('hiden');
            HideScanActions();
            ShowLoader("Обробка скриншота...");
        }

        const geminiResult = await SendFrameToGemini(file);
        const validated = ValidateGeminiScanResult(geminiResult);

        if (!validated.ok) {
            console.error("Gemini validation failed:", validated, geminiResult);
            if (cameraWasOpen) {
                const processingText = document.querySelector('.camera-processing-text');
                if (processingText) {
                    processingText.innerHTML = "Рахунок зафіксовано.<br>Розпізнавання всіх артикулів...";
                }
                ShowScanRetry(validated.message);
                return;
            }
            HideLoader();
            isScanRequestInFlight = false;
            ShowScanActions();
            document.getElementById('text-answer').classList.remove('hiden');
            document.getElementById('text-answer').innerHTML = validated.message;
            return;
        }

        document.getElementById('input-article').value = validated.articles.join(", ");
        ClearFieldError(document.getElementById('input-article'));

        if (validated.message) {
            HideLoader();
            const textAnswer = document.getElementById('text-answer');
            textAnswer.classList.remove('hiden');
            textAnswer.innerHTML = validated.message;
            isScanRequestInFlight = false;
            StopScanner();
            return;
        }

        ShowLoader("Перевірка в базі...");
        await CheckArticlesOnBackend(validated.articles);
        isScanRequestInFlight = false;
        StopScanner();
    } catch (error) {
        console.error("Screenshot / Gemini error:", error);
        const message = GetScanErrorMessage(error);
        if (cameraWasOpen) {
            const processingText = document.querySelector('.camera-processing-text');
            if (processingText) {
                processingText.innerHTML = "Рахунок зафіксовано.<br>Розпізнавання всіх артикулів...";
            }
            ShowScanRetry(message);
            return;
        }
        HideLoader();
        isScanRequestInFlight = false;
        ShowScanActions();
        document.getElementById('text-answer').classList.remove('hiden');
        document.getElementById('text-answer').innerHTML = message;
    }
}

function GetScanErrorMessage(error) {
    if (error.status === 401 || error.status === 403) return GetGeminiHttpErrorMessage(error.status);
    if (error.status === 429) return GetGeminiHttpErrorMessage(429);
    if (error.status === 400) return GetGeminiHttpErrorMessage(400);
    if (error.status >= 500) return GetGeminiHttpErrorMessage(error.status);
    if (error.status === 408 || error.name === "AbortError") {
        return "Час очікування Gemini вичерпано. Спробуйте ще раз.";
    }
    if (error.message && /Failed to fetch|NetworkError|Load failed/i.test(error.message)) {
        return "Backend недоступний. Перевірте з'єднання з сервером.";
    }
    return error.message || "Артикул не вдалося розпізнати.";
}

document.getElementById('screenshot-input').addEventListener('change', HandleScreenshotSelected);

function ShowLoader(text) {
    const loaderContainer = document.getElementById('loader-container');
    const loaderStatus = document.getElementById('loader-status');
    if (loaderContainer) loaderContainer.classList.remove('hiden');
    if (loaderStatus && text) loaderStatus.innerText = text;
}

function HideLoader() {
    const loaderContainer = document.getElementById('loader-container');
    if (loaderContainer) loaderContainer.classList.add('hiden');
}

async function CheckArticlesOnBackend(articles) {
    const textAnswer = document.getElementById('text-answer');

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        const payload = articles.length === 1
            ? { article: articles[0] }
            : { articles: articles };
        const endpoint = articles.length === 1 ? "/get/article" : "/get/articles";
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        let result = null;
        try {
            result = await response.json();
        } catch (parseError) {
            console.error("Backend returned non-JSON:", parseError);
        }

        HideLoader();

        if (!response.ok) {
            console.error("Backend HTTP error:", response.status, result);
            textAnswer.classList.remove('hiden');
            textAnswer.innerHTML = "Backend повернув помилку під час пошуку артикулів.";
            return;
        }

        textAnswer.classList.remove('hiden');
        textAnswer.innerHTML = (result && result.message) || "Інформацію отримано";
    } catch (error) {
        console.error("Backend error:", error);
        HideLoader();
        const textAnswerEl = document.getElementById('text-answer');
        textAnswerEl.classList.remove('hiden');
        if (error.name === "AbortError") {
            textAnswerEl.innerHTML = "Час очікування backend вичерпано.";
        } else {
            textAnswerEl.innerHTML = "Помилка з'єднання з сервером";
        }
    }
}
