document.addEventListener('DOMContentLoaded', function() {
    const user = getCurrentUser();
    if (!user) {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
        return;
    }

    // Hide all guide sections first
    const allGuides = document.querySelectorAll('.guide-section');
    allGuides.forEach(guide => {
        guide.style.display = 'none';
    });

    // Show the guide for the specific role
    const roleGuide = document.getElementById(`guide-${user.role}`);
    if (roleGuide) {
        roleGuide.style.display = 'block';
    } else {
        // Show a default guide if no specific guide is found
        document.getElementById('guide-default').style.display = 'block';
    }
});
