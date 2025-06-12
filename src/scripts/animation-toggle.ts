console.log("Client script loading...");

const toggle = document.querySelector(".toggle-input");
console.log("Toggle element:", toggle);

if (!toggle) {
    console.error("Toggle input element not found");
    return;
}

// Get initial state from localStorage
const initialState = localStorage.getItem("toggleState") === "true";
toggle.checked = initialState;
console.log("Initial state set to:", initialState);

// Dispatch initial state event
setTimeout(() => {
    console.log("Dispatching initial animation state:", !initialState);
    document.dispatchEvent(
        new CustomEvent("animationStateChanged", {
            detail: { isAnimating: !initialState },
        }),
    );
}, 100);

// Listen for changes
toggle.addEventListener("change", function () {
    localStorage.setItem("toggleState", String(toggle.checked));
    console.log("Change state to:", toggle.checked);

    document.dispatchEvent(
        new CustomEvent("animationStateChanged", {
            detail: { isAnimating: !toggle.checked },
        }),
    );
});