document.getElementById("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
  
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
  
    // Replace with actual authentication logic if needed
    console.log("Logging in with:");
    console.log("Email:", email);
    console.log("Password:", password);
  
    alert("Login successful!");
    window.location.href="dashboard.html";
  });
  