document.getElementById('loginBtn').addEventListener('click', () => {
    const username = document.getElementById('username').value;

    if (!username) {
        alert('Proszę wybrać imię.');
        return;
    }

    // Zapisz imię do localStorage
    localStorage.setItem('loggedInUser', username);

    // Przekieruj do głównej strony (placeholder)
    window.location.href = 'main.html';
});
