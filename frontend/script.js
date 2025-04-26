document.getElementById("signup-form").addEventListener("submit", function (e) {
    e.preventDefault();
  
    const firstName = document.getElementById("first-name").value;
    const lastName = document.getElementById("last-name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
  
    // For now, just log it. Replace this with your backend POST logic.
    console.log("Account Created:");
    console.log("Name:", firstName, lastName);
    console.log("Email:", email);
    console.log("Password:", password);
  
    alert("Account successfully created!");
    window.location.href = "dashboard.html";
  });
  