document.getElementById('loginBtn').addEventListener('click', () => {
    const username = document.getElementById('username').value;

    if (!username) {
        alert('Proszę wybrać imię.');
        return;
    }

    localStorage.setItem('loggedInUser', username);
    
    window.location.href = 'main.html';
});
