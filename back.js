function goBack(fallbackPage = "index.html") {
    if (window.history.length > 1) {
        window.history.back();
        return;
    }

    window.location.href = fallbackPage;
}
