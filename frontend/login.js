document.getElementById("login-form").addEventListener("submit", async function (e) {
    e.preventDefault();
  
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
  
    try {
        console.log('Attempting login with email:', email);
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        console.log('Login response:', data);
        
        if (response.ok) {
            // Store token and user info in localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userName', data.user.name);
            localStorage.setItem('userRole', data.user.role);
            
            console.log('Token stored:', localStorage.getItem('token'));
            console.log('User info stored:', {
                id: localStorage.getItem('userId'),
                name: localStorage.getItem('userName'),
                role: localStorage.getItem('userRole')
            });
            
            // Show success message
            alert("Login successful!");
            
            // Redirect to dashboard
            window.location.href = "dashboard.html";
        } else {
            // Show error message
            alert(data.error || "Login failed. Please try again.");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred during login. Please try again.");
    }
});
  