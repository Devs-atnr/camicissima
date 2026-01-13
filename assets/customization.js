document.addEventListener("DOMContentLoaded", function () {
  // === Global Variables (attached to window) ===
  window.customizationConfirmed = false;
  window.customizationDetails = {};

  // === Get References to Elements ===
  const customizationButton = document.getElementById("Customization-button");
  const confirmButton = document.getElementById("confirm");
  const cancelButton = document.getElementById("cancel-customization");
  const addToCartButton = document.getElementById("product-add-to-cart");
  const productIdInput = document.querySelector('input[name="id"]');

  // Debug: Log elements to ensure they exist
  console.log("Customization Button:", customizationButton);
  console.log("Confirm Button:", confirmButton);
  console.log("Cancel Button:", cancelButton);
  console.log("Add-to-Cart Button:", addToCartButton);
  console.log("Product ID Input:", productIdInput);

  // === Open the Modal When Customization Button Is Clicked ===
  if (customizationButton) {
    customizationButton.addEventListener("click", function () {
      document.getElementById("modal-cusotmation").style.display = "flex";
      document.getElementById("overlay-customization").style.display = "block";
    });
  }

  // === Confirm Button Event Listener (Only One Version) ===
  if (confirmButton) {
    confirmButton.addEventListener("click", function (event) {
      event.preventDefault(); // Prevent default behavior
      console.log("Confirm button clicked");

      let missingFields = [];

      // --- VALIDATION & DATA COLLECTION ---
      // Get initials from the three input fields
      const input1 = document.getElementById("input1").value.trim();
      const input2 = document.getElementById("input2").value.trim();
      const input3 = document.getElementById("input3").value.trim();
      const initials = [input1, input2, input3];
      const filledInitials = initials.filter(val => val !== "");

      // Validate initials: first field must be filled and no gaps should exist
      if (input1 === "") {
        missingFields.push("The first initial is required.");
      }
      if ((input1 !== "" && input2 === "" && input3 !== "") || (input1 !== "" && input2 === "")) {
        missingFields.push("Please fill in initials in order without gaps.");
      }
      if (filledInitials.length < 2) {
        missingFields.push("Please provide at least two initials.");
      }

      // Validate initial color and initial position selections
      const initialColorElem = document.querySelector("input[name='color']:checked");
      const initialPositionElem = document.querySelector("input[name='position']:checked");
      // const symbolColorElem = document.querySelector("input[name='symbolColor']:checked");
      if (!initialColorElem) missingFields.push("Initial color is required.");
      if (!initialPositionElem) missingFields.push("Initial position is required.");

// Validate symbol selection
const selectedSymbolElem = document.querySelector("input[name='symbol']:checked");
// If no symbol is selected, default to "No Symbol"
const symbolValue = selectedSymbolElem ? selectedSymbolElem.value : "No Symbol";
// Check if the default "No Symbol" is selected
const isDefaultSymbol = (symbolValue === "No Symbol");

let symbolColorElem = null;
let symbolPositionElem = null;

if (!isDefaultSymbol) {
  // If a non-default symbol is selected, validate that both color and position are chosen
  symbolColorElem = document.querySelector("input[name='symbolColor']:checked");
  symbolPositionElem = document.querySelector("input[name='position-symbol']:checked");
  if (!symbolColorElem) missingFields.push("Symbol color is required.");
  if (!symbolPositionElem) missingFields.push("Symbol position is required.");
}

      // (Optional) If you are using a dropdown for symbol order:
      const symbolDropdownElem = document.getElementById("symbol-position");

      if (missingFields.length > 0) {
        alert("Please fix the following errors:\n" + missingFields.join("\n"));
        return;
      }

      // --- CREATE THE CUSTOMIZATION OBJECT ---
      window.customizationDetails = {
        style: document.querySelector('input[name="style"]:checked')?.value || "N/A",
        Initials: filledInitials.join(""),
        Color: initialColorElem ? initialColorElem.value : "None",
        Position: initialPositionElem ? initialPositionElem.value : "None",
        Symbol: !isDefaultSymbol ? symbolValue : "No Symbol",
        "Symbol Color": symbolColorElem ? symbolColorElem.value : "None",
        "Symbol Position": symbolPositionElem ? symbolPositionElem.value : (symbolDropdownElem ? symbolDropdownElem.value : "None"),
        "Symbol Position Order": document.getElementById('symbol-position').value || "N/A",
        letterCount: filledInitials.length
      };

      // Set the global flag to true
      window.customizationConfirmed = true;

      console.log("Customization confirmed:", window.customizationDetails);
      alert("Customization confirmed! Now click 'Add to Cart' to apply it.");
      closeModalCustomization();
    });
  }



  // === Add-to-Cart Event Listener ===
  if (addToCartButton) {
    addToCartButton.addEventListener("click", async function (e) {
      console.log("Add-to-cart clicked", window.customizationConfirmed, window.customizationDetails);
      if (!window.customizationConfirmed) return; // Only proceed if customization is confirmed

      e.preventDefault(); // Prevent default form submission

      if (!productIdInput) {
        alert("Product ID not found.");
        return;
      }

      // Get the main product variant ID
      const productVariantId = productIdInput.value;
      console.log("Product Variant ID:", productVariantId);

      // Determine additional customization variant IDs based on the number of initials
      let customizationVariantIds = [];
      const letterCount = window.customizationDetails.letterCount;

      if (letterCount === 3) {
        customizationVariantIds.push("49951196414228"); // 3 Letters Variant
      } else if (letterCount === 2) {
        customizationVariantIds.push("49966066598164"); // 2 Letters Variant
      }

      // If a non-default symbol was selected, add its variant ID
      if (window.customizationDetails.Symbol !== "No Symbol") {
        customizationVariantIds.push("49951213650196"); // Symbol Variant
      }

      try {
        // Add the main product to the cart
        let response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: productVariantId,
            quantity: 1,
            properties: window.customizationDetails
          })
        });
        console.log("Main product add response:", response);

        // Add each customization variant to the cart
        for (const variantId of customizationVariantIds) {
          response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: variantId,
              quantity: 1,
              properties: {
                "Linked Product": productVariantId,
                ...window.customizationDetails
              }
            })
          });
          console.log("Customization variant add response:", response);
        }

        alert("Product and customization added to your cart!");
        window.location.href = '/cart'; // Redirect to the cart page
      } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong. Please try again.");
      }

      // Reset customization data
      window.customizationConfirmed = false;
      window.customizationDetails = {};
    });
  } else {
    console.warn("Add-to-cart button not found.");
  }

  // // === Function to Close the Modal ===
  // function closeModalCustomization() {
  //   const modal = document.getElementById("modal-cusotmation");
  //   const overlay = document.getElementById("overlay-customization");
  //   if (modal) modal.style.display = "none";
  //   if (overlay) overlay.style.display = "none";
  // }

  // ... (Keep your other event listeners such as those for updating the output bar, disabling inputs, etc.)
});




// Walaa - 5:30 2-5-2025 previous working code 
// document.addEventListener("DOMContentLoaded", function () {
//   // === Global Variables (attached to window) ===
//   window.customizationConfirmed = false;
//   window.customizationDetails = {};

//   // === Get References to Elements ===
//   const customizationButton = document.getElementById("Customization-button");
//   const confirmButton = document.getElementById("confirm");
//   const cancelButton = document.getElementById("cancel-customization");
//   const addToCartButton = document.getElementById("product-add-to-cart");
//   const productIdInput = document.querySelector('input[name="id"]');

//   // Debug: Log elements to ensure they exist
//   console.log("Customization Button:", customizationButton);
//   console.log("Confirm Button:", confirmButton);
//   console.log("Cancel Button:", cancelButton);
//   console.log("Add-to-Cart Button:", addToCartButton);
//   console.log("Product ID Input:", productIdInput);

//   // === Open the Modal When Customization Button Is Clicked ===
//   if (customizationButton) {
//     customizationButton.addEventListener("click", function () {
//       document.getElementById("modal-cusotmation").style.display = "flex";
//       document.getElementById("overlay-customization").style.display = "block";
//     });
//   }

//   // === Confirm Button Event Listener (Only One Version) ===
//   if (confirmButton) {
//     confirmButton.addEventListener("click", function (event) {
//       event.preventDefault(); // Prevent default behavior
//       console.log("Confirm button clicked");

//       let missingFields = [];

//       // --- VALIDATION & DATA COLLECTION ---
//       // Get initials from the three input fields
//       const input1 = document.getElementById("input1").value.trim();
//       const input2 = document.getElementById("input2").value.trim();
//       const input3 = document.getElementById("input3").value.trim();
//       const initials = [input1, input2, input3];
//       const filledInitials = initials.filter(val => val !== "");

//       // Validate initials: first field must be filled and no gaps should exist
//       if (input1 === "") {
//         missingFields.push("The first initial is required.");
//       }
//       if ((input1 !== "" && input2 === "" && input3 !== "") || (input1 !== "" && input2 === "")) {
//         missingFields.push("Please fill in initials in order without gaps.");
//       }
//       if (filledInitials.length < 2) {
//         missingFields.push("Please provide at least two initials.");
//       }

//       // Validate initial color and initial position selections
//       const initialColorElem = document.querySelector("input[name='color']:checked");
//       const initialPositionElem = document.querySelector("input[name='position']:checked");
//       // const symbolColorElem = document.querySelector("input[name='symbolColor']:checked");
//       if (!initialColorElem) missingFields.push("Initial color is required.");
//       if (!initialPositionElem) missingFields.push("Initial position is required.");

//       // Validate symbol selection
//       const selectedSymbolElem = document.querySelector("input[name='symbol']:checked");
//       const symbolValue = selectedSymbolElem ? selectedSymbolElem.value : "symbol1";
//       const isDefaultSymbol = (symbolValue === "symbol1");

//       let symbolColorElem = null;
//       let symbolPositionElem = null;
//       if (!isDefaultSymbol) {
//         symbolColorElem = document.querySelector("input[name='symbolColor']:checked");
//         symbolPositionElem = document.querySelector("input[name='position-symbol']:checked");
//         if (!symbolColorElem) missingFields.push("Symbol color is required.");
//         if (!symbolPositionElem) missingFields.push("Symbol position is required.");
//       }
//       // (Optional) If you are using a dropdown for symbol order:
//       const symbolDropdownElem = document.getElementById("symbol-position");

//       if (missingFields.length > 0) {
//         alert("Please fix the following errors:\n" + missingFields.join("\n"));
//         return;
//       }

//       // --- CREATE THE CUSTOMIZATION OBJECT ---
//       window.customizationDetails = {
//         style: document.querySelector('input[name="style"]:checked')?.value || "N/A",
//         Initials: filledInitials.join(""),
//         Color: initialColorElem ? initialColorElem.value : "None",
//         Position: initialPositionElem ? initialPositionElem.value : "None",
//         Symbol: !isDefaultSymbol ? symbolValue : "No Symbol",
//         "Symbol Color": symbolColorElem ? symbolColorElem.value : "None",
//         "Symbol Position": symbolPositionElem ? symbolPositionElem.value : (symbolDropdownElem ? symbolDropdownElem.value : "None"),
//         "Symbol Position Order": document.getElementById('symbol-position').value || "N/A",
//         letterCount: filledInitials.length
//       };

//       // Set the global flag to true
//       window.customizationConfirmed = true;

//       console.log("Customization confirmed:", window.customizationDetails);
//       alert("Customization confirmed! Now click 'Add to Cart' to apply it.");
//       closeModalCustomization();
//     });
//   }



//   // === Add-to-Cart Event Listener ===
//   if (addToCartButton) {
//     addToCartButton.addEventListener("click", async function (e) {
//       console.log("Add-to-cart clicked", window.customizationConfirmed, window.customizationDetails);
//       if (!window.customizationConfirmed) return; // Only proceed if customization is confirmed

//       e.preventDefault(); // Prevent default form submission

//       if (!productIdInput) {
//         alert("Product ID not found.");
//         return;
//       }

//       // Get the main product variant ID
//       const productVariantId = productIdInput.value;
//       console.log("Product Variant ID:", productVariantId);

//       // Determine additional customization variant IDs based on the number of initials
//       let customizationVariantIds = [];
//       const letterCount = window.customizationDetails.letterCount;

//       if (letterCount === 3) {
//         customizationVariantIds.push("49951196414228"); // 3 Letters Variant
//       } else if (letterCount === 2) {
//         customizationVariantIds.push("49966066598164"); // 2 Letters Variant
//       }

//       // If a non-default symbol was selected, add its variant ID
//       if (window.customizationDetails.Symbol !== "No Symbol") {
//         customizationVariantIds.push("49951213650196"); // Symbol Variant
//       }

//       try {
//         // Add the main product to the cart
//         let response = await fetch('/cart/add.js', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             id: productVariantId,
//             quantity: 1,
//             properties: window.customizationDetails
//           })
//         });
//         console.log("Main product add response:", response);

//         // Add each customization variant to the cart
//         for (const variantId of customizationVariantIds) {
//           response = await fetch('/cart/add.js', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//               id: variantId,
//               quantity: 1,
//               properties: {
//                 "Linked Product": productVariantId,
//                 ...window.customizationDetails
//               }
//             })
//           });
//           console.log("Customization variant add response:", response);
//         }

//         alert("Product and customization added to your cart!");
//         window.location.href = '/cart'; // Redirect to the cart page
//       } catch (error) {
//         console.error("Error:", error);
//         alert("Something went wrong. Please try again.");
//       }

//       // Reset customization data
//       window.customizationConfirmed = false;
//       window.customizationDetails = {};
//     });
//   } else {
//     console.warn("Add-to-cart button not found.");
//   }

//   // // === Function to Close the Modal ===
//   // function closeModalCustomization() {
//   //   const modal = document.getElementById("modal-cusotmation");
//   //   const overlay = document.getElementById("overlay-customization");
//   //   if (modal) modal.style.display = "none";
//   //   if (overlay) overlay.style.display = "none";
//   // }

//   // ... (Keep your other event listeners such as those for updating the output bar, disabling inputs, etc.)
// });
