class CartItems extends HTMLElement {
  constructor() {
    super();

    this.cartCountDown = document.getElementById(`CartCountdown-${this.dataset.section}`);
    this.giftCardElement = document.getElementById('is-a-gift');
    this.giftCardButton = document.getElementById('cart-gift-wrapping');
    this.removeButtons = document.querySelectorAll('[data-cart-remove]');
    this.toCheckoutButton = document.getElementById('cart-checkout');
    this.couponCodeInput = document.getElementById('cart-coupon-code');
    this.cartNoteInput = document.getElementById('cart-note');
    this.checkTerms = document.getElementById('cart_conditions');

    this.toCheckoutButton?.addEventListener('click', this.handleToCheckoutPage.bind(this));

    this.initToCheckoutButtonDisabling();
    this.initCartCountdown();
    if (this.giftCardElement) this.initGiftCardElement();
    this.initGiftCardManipulation();
    // this.initQuantityUpdateButtons();
  }

  initGiftCardElement() {
    const isChecked = this.giftCardButton?.dataset.isChecked;
    if (isChecked === 'true') {
      const variantId = this.giftCardButton?.dataset.giftId;
      const giftCardRemoveButton = document.querySelector(`[data-cart-remove-id="${variantId}"]`);
      const giftCardQuantityInput = document.querySelector(`[data-cart-quantity-id="${variantId}"]`);

      this.giftCardElement.style.display = 'none';
      giftCardRemoveButton?.addEventListener('click', () => {
        this.giftCardButton.dataset.isChecked = 'false';
      });

      giftCardQuantityInput?.addEventListener('change', (e) => {
        const value = Number(e.target.value);
        if (value <= 0) {
          this.giftCardButton.dataset.isChecked = 'false';
        }
      });
    } else {
      this.giftCardElement.style.display = 'flex';
    }
  }

  initGiftCardManipulation() {
    if (this.giftCardButton) {
      this.giftCardButton.removeEventListener('click', this.onAddGiftCardClick.bind(this));
      this.giftCardButton.addEventListener('click', this.onAddGiftCardClick.bind(this));
    }
  }

  onAddGiftCardClick(e) {
    e.preventDefault();
    e.stopPropagation();
    this.giftCardButton.dataset.isChecked = 'true';
  }

  initToCheckoutButtonDisabling() {
    if (this.checkTerms) {
      window.addEventListener('load', () => {
        this.toCheckoutButton.disabled = !this.checkTerms.checked;
      });
    }
  }

  async handleToCheckoutPage(e) {
    e.preventDefault();

    try {
      const couponCode = this.couponCodeInput?.value;
      if (couponCode) {
        localStorage.setItem('storedDiscount', couponCode);
        const couponRes = await fetch(`/discount/${couponCode}`);
        const text1 = await couponRes.text();
      }

      const cartNote = this.cartNoteInput?.value;
      if (cartNote) {
        const cartNoteBody = JSON.stringify({ note: cartNote });
        const cartNoteRes = await fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body: cartNoteBody } });
        const text2 = await cartNoteRes.text();
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }

    let checkoutHref = this.toCheckoutButton.dataset.href;
    if (checkoutHref == null) {
      checkoutHref = `${window.routes?.root ? window.routes.root : ""}/checkout`;
    }

    window.location = checkoutHref;
  }

  initCartCountdown() {
    if (!this.cartCountDown) return;

    if (!this.cartCountDown.classList.contains('is-running')) {
      const duration = this.cartCountDown.getAttribute('data-cart-countdown') * 60;
      const element = this.cartCountDown.querySelector('.time');

      this.cartCountDown.classList.add('is-running');
      this.startTimerCartCountdown(duration, element);
    }
  }

  startTimerCartCountdown(duration, element) {
    var timer = duration,
      minutes,
      seconds,
      text;

    var startCoundown = setInterval(() => {
      minutes = parseInt(timer / 60, 10);
      seconds = parseInt(timer % 60, 10);

      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;
      text = minutes + ":" + seconds;

      element.innerText = text;

      if (--timer < 0) {
        clearInterval(startCoundown);
        this.cartCountDown.remove();
      }
    }, 1000);
  }
}

customElements.define('cart-items', CartItems);

class Accordion extends HTMLElement {
  constructor() {
    super();
    this.header = this.firstElementChild;
    this.content = this.lastElementChild;

    this.header.addEventListener('click', this.onSummaryClick.bind(this));
  }

  onSummaryClick(event) {
    event.preventDefault();
    this.hasAttribute('open') ? this.close() : this.open(event);
  }

  open(event) {
    this.setAttribute('open', true);
    this.setAttribute('aria-expanded', 'true');
    this.content.setAttribute('aria-hidden', 'false');
    $(this.content).slideDown();
  }

  close() {
    this.removeAttribute('open');
    this.setAttribute('aria-expanded', 'false');
    this.content.setAttribute('aria-hidden', 'true');
    $(this.content).slideUp();
  }
}

customElements.define('accordion-block', Accordion);

// Popup Logic
document.addEventListener('DOMContentLoaded', function () {
  // Only run on cart page - check for cart-items element
  const cartSection = document.querySelector('cart-items[data-section-type="cart"]');
  if (!cartSection) {
    console.log('Not on cart page.');
    return;
  }

  console.log('Cart page detected, initializing popup logic.');

  // Attach listeners to plus buttons in capture phase
  const plusButtons = document.querySelectorAll('[data-plus-quantity-cart]');
  plusButtons.forEach(button => {
    button.removeEventListener('click', handlePlusClick); // Remove any existing listeners
    button.addEventListener('click', handlePlusClick, { capture: true }); // Capture phase to preempt others
  });

  const cancelButton = document.getElementById('cancel-popup');
  if (cancelButton) {
    cancelButton.addEventListener('click', hideVariantPopup);
  } else {
    console.log('Cancel button not found.');
  }
});

function handlePlusClick(event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  const cartContainer = event.target.closest('cart-update-quantity');
  if (!cartContainer) {
    console.log('Cart container not found.');
    return;
  }

  const productId = cartContainer.getAttribute('data-product');
  let currentVariantId = cartContainer.getAttribute('data-variant');
  const quantityInput = cartContainer.querySelector('input[name="quantity"]');
  if (!quantityInput) {
    console.log('Quantity input not found.');
    return;
  }

  // Ensure currentVariantId is set correctly
  if (!currentVariantId) {
    currentVariantId = quantityInput.getAttribute('data-variant') || null;
  }

  const currentQuantity = parseInt(quantityInput.value, 10);
  const lineKey = quantityInput.getAttribute('data-line');
  const lineIndex = parseInt(quantityInput.getAttribute('data-index'), 10); // Get numeric index

  const variants = window.productVariants && window.productVariants[productId];
  console.log('Variants for product', productId, ':', variants);

  if (!variants || variants.length <= 1) {
    console.log('Single or no variants, updating quantity directly.');
    updateCartItemQuantity(lineIndex, currentQuantity + 1); // Use index instead of key
    return;
  }

  const cartItemData = {
    productId: productId,
    currentVariantId: currentVariantId,
    currentQuantity: currentQuantity,
    lineKey: lineKey,
    lineIndex: lineIndex // Add index for clarity
  };
  console.log('Showing popup with cart item data:', cartItemData);

  showVariantPopup(cartItemData);
}

function showVariantPopup(cartItemData) {
  const popup = document.getElementById('variant-popup');
  const variantOptionsContainer = document.getElementById('variant-options');

  if (!popup || !variantOptionsContainer) {
    console.log('Popup or variant options container not found.');
    return;
  }

  variantOptionsContainer.innerHTML = '';

  const variants = window.productVariants && window.productVariants[cartItemData.productId];
  if (!variants || variants.length === 0) {
    console.log('No variants available for product:', cartItemData.productId);
    alert('No size options available for this product.');
    return;
  }

  variants.forEach(function (variant) {
    const button = document.createElement('button');
    button.className = 'variant-option-button';
    button.textContent = variant.title;

    if (!variant.available || (variant.inventory !== null && variant.inventory <= 0)) {
      button.disabled = true;
      button.textContent += ' (Out of Stock)';
    }

    button.addEventListener('click', function () {
      handleVariantSelection(cartItemData, variant.id);
    });
    variantOptionsContainer.appendChild(button);
  });

  popup.style.display = 'flex';
  console.log('Popup displayed.');
}

function hideVariantPopup() {
  const popup = document.getElementById('variant-popup');
  if (popup) {
    popup.style.display = 'none';
    console.log('Popup hidden.');
  }
}

function handleVariantSelection(cartItemData, selectedVariantId) {
  // Hide the popup immediately
  hideVariantPopup();

  // Convert both IDs to strings for a reliable comparison
  const currentVariantIdStr = String(cartItemData.currentVariantId);
  const selectedVariantIdStr = String(selectedVariantId);

  console.log('DEBUG: Comparing variant IDs', {
    current: currentVariantIdStr,
    selected: selectedVariantIdStr
  });

  if (currentVariantIdStr === selectedVariantIdStr) {
    console.log('DEBUG: Same variant selected. Updating quantity.');
    updateCartItemQuantity(cartItemData.lineIndex, cartItemData.currentQuantity + 1);
  } else {
    console.log('DEBUG: Different variant selected. Proceeding with new item addition.');

    // Retrieve the list of variants for this product from client-side data
    const variants = window.productVariants && window.productVariants[cartItemData.productId];
    console.log('DEBUG: Retrieved variants for product', cartItemData.productId, ':', variants);

    // Find the variant that matches the selected variant ID
    const selectedVariant = variants ? variants.find(v => String(v.id) === selectedVariantIdStr) : null;
    console.log('DEBUG: Found selected variant from client data:', selectedVariant);

    // If no variant is found, exit with an error.
    if (!selectedVariant) {
      console.error('DEBUG: No matching variant found in window.productVariants.');
      alert('There was an error updating the cart quantity. Please try again.');
      return;
    }

    // Log raw inventory and availability details
    console.log('DEBUG: Selected variant details:', {
      available: selectedVariant.available,
      rawInventory: selectedVariant.inventory
    });

    // Convert inventory to a number (if not null). If it's null, assume unlimited.
    let inventory = selectedVariant.inventory;
    if (inventory !== null) {
      inventory = Number(inventory);
    } else {
      inventory = Infinity;
    }
    console.log('DEBUG: Parsed inventory value:', inventory);

    // Check if the variant is available and has at least one unit in stock.
    if (!selectedVariant.available) {
      console.log('DEBUG: Selected variant is marked as unavailable.');
      alert('There was an error updating the cart quantity. Please try again.');
      return;
    }
    if (inventory < 1) {
      console.log('DEBUG: Inventory check failed: inventory is less than 1.');
      alert('There was an error updating the cart quantity. Please try again.');
      return;
    }

    // New check: if the variant is already in the cart, get its current quantity.
    console.log('DEBUG: Checking current cart contents for variant:', selectedVariantIdStr);
    fetch('/cart.js')
      .then(response => response.json())
      .then(cartData => {
        console.log('DEBUG: Current cart data:', cartData);
        // Find if the selected variant is already in the cart.
        const currentCartLine = cartData.items.find(
          item => String(item.variant_id) === selectedVariantIdStr
        );
        const currentQuantityInCart = currentCartLine ? currentCartLine.quantity : 0;
        console.log('DEBUG: Current quantity in cart for selected variant:', currentQuantityInCart);

        // Calculate desired new quantity (existing + 1)
        const desiredNewQuantity = currentQuantityInCart + 1;
        console.log('DEBUG: Desired new quantity for selected variant:', desiredNewQuantity);

        // Check if the new desired quantity exceeds available inventory.
        if (desiredNewQuantity > inventory) {
          console.log('DEBUG: Desired quantity exceeds available inventory.');
          alert('There was an error updating the cart quantity. Please try again.');
          return;
        }

        console.log('DEBUG: Inventory check passed. Adding new variant to cart.');
        addNewVariantToCart(selectedVariantId, 1);
      })
      .catch(error => {
        console.error('DEBUG: Error fetching cart data:', error);
        // As a fallback, attempt to add the variant if we can’t check cart contents.
        addNewVariantToCart(selectedVariantId, 1);
      });
  }
}



function updateCartItemQuantity(line, newQuantity) {
  console.log('Updating cart item:', { line: line, quantity: newQuantity });

  fetch('/cart/change.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ line: line, quantity: newQuantity })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Cart update response:', data);
      location.reload();
    })
    .catch(error => {
      console.error('Error updating cart item:', error);
      alert('There was an error updating the cart quantity. Please try again.');
    });
}

function addNewVariantToCart(variantId, quantity) {
  fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: variantId, quantity: quantity })
  })
    .then(response => response.json())
    .then(() => {
      console.log('New variant added, reloading page.');
      location.reload();
    })
    .catch(error => {
      console.error('Error adding new variant to cart:', error);
      alert('There was an error adding the product to the cart. Please try again.');
    });
}




// OLD Cart js before adding the popup size - 4-3-2025

// class CartItems extends HTMLElement {
//     constructor() {
//         super();

//         this.cartCountDown = document.getElementById(`CartCountdown-${this.dataset.section}`)
//         this.giftCardElement = document.getElementById('is-a-gift')
//         this.giftCardButton = document.getElementById('cart-gift-wrapping')
//         this.removeButtons = document.querySelectorAll('[data-cart-remove]')
//         this.toCheckoutButton = document.getElementById('cart-checkout')
//         this.couponCodeInput = document.getElementById('cart-coupon-code')
//         this.cartNoteInput = document.getElementById('cart-note')
//         this.checkTerms = document.getElementById('cart_conditions')

//         this.toCheckoutButton?.addEventListener('click', this.handleToCheckoutPage.bind(this))

//         this.initToCheckoutButtonDisabling()
//         this.initCartCountdown()
//         if (this.giftCardElement) this.initGiftCardElement()
//         this.initGiftCardManipulation()
//         // this.initQuantityUpdateButtons()
//   }

//     initGiftCardElement() {
//         const isChecked = this.giftCardButton?.dataset.isChecked
//         if (isChecked === 'true') {
//             const variantId = this.giftCardButton?.dataset.giftId
//             const giftCardRemoveButton = document.querySelector(`[data-cart-remove-id="${variantId}"]`)
//             const giftCardQuantityInput = document.querySelector(`[data-cart-quantity-id="${variantId}"]`)

//             this.giftCardElement.style.display = 'none'
//             giftCardRemoveButton?.addEventListener('click', () => {
//                 this.giftCardButton.dataset.isChecked = 'false'
//             })

//             giftCardQuantityInput?.addEventListener('change', (e) => {
//                 const value = Number(e.target.value)
//                 if (value  <= 0) {
//                     this.giftCardButton.dataset.isChecked = 'false'
//                 }
//             })
//         } else {
//           this.giftCardElement.style.display = 'flex'
//         }
//     }

//     initGiftCardManipulation() {
//         if (this.giftCardButton) {
//             this.giftCardButton.removeEventListener('click', this.onAddGiftCardClick.bind(this))
//             this.giftCardButton.addEventListener('click', this.onAddGiftCardClick.bind(this))
//         }
//     }

//     onAddGiftCardClick(e) {
//         e.preventDefault()
//         e.stopPropagation()
//         this.giftCardButton.dataset.isChecked = 'true'
//     }

//     initToCheckoutButtonDisabling() {
//         if (this.checkTerms) {
//             window.addEventListener('load', () => {
//                 this.toCheckoutButton.disabled = !this.checkTerms.checked
//             })
//         }
//     }

//     // initQuantityUpdateButtons() {
//     //     this.querySelectorAll('.btn-quantity').forEach(button => {
//     //         button.removeEventListener('click', this.onButtonClick.bind(this))
//     //         button.addEventListener('click', this.onButtonClick.bind(this))
//     //     })
//     // }

//     // onButtonClick(event) {
//     //     event.preventDefault();
//     //     const inputElement = event.target.parentElement.querySelector('.quantity');
//     //     const value = Number(inputElement.value);
//     //     let newVal
//     //     if (event.target.classList.contains('plus')) {
//     //         newVal = value + 1;
//     //     } else {
//     //         newVal = value - 1;
//     //     }

//     //     if (newVal >= 0) {
//     //         const changeEvent = new Event('change', { bubbles: true })

//     //         inputElement.value = newVal;
//     //         inputElement.dispatchEvent(changeEvent);
//     //     } 
//     // }

//     async handleToCheckoutPage(e) {
//         e.preventDefault()

//         try {
//             // saving coupon
//             const couponCode = this.couponCodeInput?.value 
//             if (couponCode) {
//                 localStorage.setItem('storedDiscount', couponCode)
//                 const couponRes =  await fetch(`/discount/${couponCode}`)
//                 const text1 = await couponRes.text()
//             }
            
//             // saving cart note
//             const cartNote = this.cartNoteInput?.value
//             if (cartNote) {
//                 const cartNoteBody = JSON.stringify({ note: cartNote })
//                 const cartNoteRes = await fetch(`${routes.cart_update_url}`, {...fetchConfig(), ...{ body: cartNoteBody }})
//                 const text2 = await cartNoteRes.text()
//             }

//         } catch(error) {
//             console.error(`Error: ${error.message}`)
//         }

//         let checkoutHref = this.toCheckoutButton.dataset.href;
//         if (checkoutHref == null) {
//             checkoutHref = `${window.routes?.root ? window.routes.root : ""}/checkout`;
//         }
        
//         window.location = checkoutHref;
//     }

//     initCartCountdown(){
//         if(!this.cartCountDown) return;

//         if(!this.cartCountDown.classList.contains('is-running')){
//             const duration = this.cartCountDown.getAttribute('data-cart-countdown') * 60
//             const element = this.cartCountDown.querySelector('.time');

//             this.cartCountDown.classList.add('is-running');
//             this.startTimerCartCountdown(duration, element);
//         }
//     }

//     startTimerCartCountdown(duration, element){
//         var timer = duration, minutes, seconds, text;

//         var startCoundown = setInterval(() => {
//             minutes = parseInt(timer / 60, 10);
//             seconds = parseInt(timer % 60, 10);

//             minutes = minutes < 10 ? "0" + minutes : minutes;
//             seconds = seconds < 10 ? "0" + seconds : seconds;
//             text = minutes + ":" + seconds;

//             element.innerText = text;

//             if (--timer < 0) {
//                 clearInterval(startCoundown);
//                 this.cartCountDown.remove();
//             }
//         }, 1000);
//     }
// }

// customElements.define('cart-items', CartItems);

// class Accordion extends HTMLElement {
//     constructor() {
//         super();
//         this.header = this.firstElementChild;
//         this.content = this.lastElementChild;

//         this.header.addEventListener('click', this.onSummaryClick.bind(this));
//     }

//     onSummaryClick(event) {
//         event.preventDefault();
//         this.hasAttribute('open') ? this.close() : this.open(event);
//     }

//     open(event) {
//         this.setAttribute('open', true);
//         this.setAttribute('aria-expanded', 'true');
//         this.content.setAttribute('aria-hidden', 'false');
//         $(this.content).slideDown()
//     }

//     close() {
//         this.removeAttribute('open');
//         this.setAttribute('aria-expanded', 'false');
//         this.content.setAttribute('aria-hidden', 'true');
//         $(this.content).slideUp()
//     }
// }

// customElements.define('accordion-block', Accordion);

