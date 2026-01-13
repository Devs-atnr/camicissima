function getFocusableElements(container) {
    return Array.from(
        container.querySelectorAll(
            "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object"
        )
    );
}

const trapFocusHandlers = {};
const warningTime = 3000

function trapFocus(container, elementToFocus = container) {
    var elements = getFocusableElements(container);
    var first = elements[0];
    var last = elements[elements.length - 1];

    removeTrapFocus();

    trapFocusHandlers.focusin = (event) => {
        if (
            event.target !== container &&
            event.target !== last &&
            event.target !== first
        )
        return;
        
        document.addEventListener('keydown', trapFocusHandlers.keydown);
    };

    trapFocusHandlers.focusout = function() {
        document.removeEventListener('keydown', trapFocusHandlers.keydown);
    };

    trapFocusHandlers.keydown = function(event) {
        if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
        // On the last focusable element and tab forward, focus the first element.
        if (event.target === last && !event.shiftKey) {
        event.preventDefault();
        first.focus();
        }

        //  On the first focusable element and tab backward, focus the last element.
        if (
            (event.target === container || event.target === first) &&
            event.shiftKey
        ) {
            event.preventDefault();
            last.focus();
        }
    };

    document.addEventListener('focusout', trapFocusHandlers.focusout);
    document.addEventListener('focusin', trapFocusHandlers.focusin);

    elementToFocus.focus();
}

function pauseAllMedia() {
    document.querySelectorAll('.js-youtube').forEach((video) => {
        video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
    });

    document.querySelectorAll('.js-vimeo').forEach((video) => {
        video.contentWindow.postMessage('{"method":"pause"}', '*');
    });

    document.querySelectorAll('video').forEach((video) => video.pause());
    document.querySelectorAll('product-model').forEach((model) => model.modelViewerUI?.pause());
}

function removeTrapFocus(elementToFocus = null) {
    document.removeEventListener('focusin', trapFocusHandlers.focusin);
    document.removeEventListener('focusout', trapFocusHandlers.focusout);
    document.removeEventListener('keydown', trapFocusHandlers.keydown);

    if (elementToFocus) elementToFocus.focus();
}

function debounce(fn, wait) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

const serializeForm = form => {
    const obj = {};
    const formData = new FormData(form);
    for (const key of formData.keys()) {
        obj[key] = formData.get(key);
    }

    return JSON.stringify(obj);
};

function throttle(fn, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return fn(...args);
  };
}

function fetchConfig(type = 'json') {
    return {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': `application/${type}` }
    };
}

function extractContent(string) {
    var div = document.createElement('div');
    div.innerHTML = string;

    return div.textContent || div.innerText;
}

/*
 * Shopify Common JS
 *
 */
if ((typeof window.Shopify) == 'undefined') {
    window.Shopify = {};
}

Shopify.bind = function(fn, scope) {
    return function() {
        return fn.apply(scope, arguments);
    }
};

Shopify.setSelectorByValue = function(selector, value) {
    for (var i = 0, count = selector.options.length; i < count; i++) {
        var option = selector.options[i];

        if (value == option.value || value == option.innerHTML) {
            selector.selectedIndex = i;
            return i;
        }
    }
};

Shopify.addListener = function(target, eventName, callback) {
    target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent('on'+eventName, callback);
};

Shopify.postLink = function(path, options) {
    options = options || {};
    var method = options['method'] || 'post';
    var params = options['parameters'] || {};

    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for(var key in params) {
        var hiddenField = document.createElement("input");

        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", key);
        hiddenField.setAttribute("value", params[key]);
        form.appendChild(hiddenField);
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function(country_domid, province_domid, options) {
    this.countryEl         = document.getElementById(country_domid);
    this.provinceEl        = document.getElementById(province_domid);
    this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

    Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler,this));

    this.initCountry();
    this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
    initCountry: function() {
        var value = this.countryEl.getAttribute('data-default');
        Shopify.setSelectorByValue(this.countryEl, value);
        this.countryHandler();
    },

    initProvince: function() {
        var value = this.provinceEl.getAttribute('data-default');

        if (value && this.provinceEl.options.length > 0) {
            Shopify.setSelectorByValue(this.provinceEl, value);
        }
    },

    countryHandler: function(e) {
        var opt       = this.countryEl.options[this.countryEl.selectedIndex];
        var raw       = opt.getAttribute('data-provinces');
        var provinces = JSON.parse(raw);

        this.clearOptions(this.provinceEl);

        if (provinces && provinces.length == 0) {
            this.provinceContainer.style.display = 'none';
        } else {
            for (var i = 0; i < provinces.length; i++) {
                var opt = document.createElement('option');
                opt.value = provinces[i][0];
                opt.innerHTML = provinces[i][1];
                this.provinceEl.appendChild(opt);
            }

            this.provinceContainer.style.display = "";
        }
    },

    clearOptions: function(selector) {
        while (selector.firstChild) {
            selector.removeChild(selector.firstChild);
        }
    },

    setOptions: function(selector, values) {
        for (var i = 0, count = values.length; i < values.length; i++) {
            var opt = document.createElement('option');

            opt.value = values[i];
            opt.innerHTML = values[i];
            selector.appendChild(opt);
        }
    }
};

Shopify.formatMoney = function(cents, format) {
    if (typeof cents == 'string') { cents = cents.replace('.',''); }
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = (format || this.money_format);

    function defaultOption(opt, def) {
        return (typeof opt == 'undefined' ? def : opt);
    }

    function formatWithDelimiters(number, precision, thousands, decimal) {
        precision = defaultOption(precision, 2);
        thousands = defaultOption(thousands, ',');
        decimal   = defaultOption(decimal, '.');

        if (isNaN(number) || number == null) { return 0; }

        number = (number/100.0).toFixed(precision);

        var parts   = number.split('.'),
            dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
            cents   = parts[1] ? (decimal + parts[1]) : '';

        return dollars + cents;
    }

    switch(formatString.match(placeholderRegex)[1]) {
        case 'amount':
            value = formatWithDelimiters(cents, 2);
            break;
        case 'amount_no_decimals':
            value = formatWithDelimiters(cents, 0);
            break;
        case 'amount_with_comma_separator':
            value = formatWithDelimiters(cents, 2, '.', ',');
            break;
        case 'amount_no_decimals_with_comma_separator':
            value = formatWithDelimiters(cents, 0, '.', ',');
            break;
    }

    return formatString.replace(placeholderRegex, value);
}

Shopify.getCart = function(callback) {
    $.getJSON('/cart.js', function (cart, textStatus) {
        if ((typeof callback) === 'function') {
            callback(cart);
        } else {
            Shopify.onCartUpdate(cart);
        }
    });
}

Shopify.onCartUpdate = function(cart) {
    alert('There are now ' + cart.item_count + ' items in the cart.');
}

Shopify.changeItem = function(variant_id, quantity, index, callback) {
    getCartUpdate(index, quantity, callback)
}

Shopify.removeItem = function(variant_id, index, callback) {
    getCartUpdate(index, 0, callback)
}

function getCartUpdate(line, quantity, callback) {
    const body = JSON.stringify({
        line,
        quantity,
        sections_url: window.location.pathname,
    });

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
    .then((response) => {
        return response.text();
    })
    .then((state) => {
        const parsedState = JSON.parse(state);

        if (parsedState.errors) {
            showWarning('Error : ' + parsedState.errors, warningTime);
            return;
        }

        if ((typeof callback) === 'function') {
            callback(parsedState);
        } else {
            Shopify.onCartUpdate(parsedState);
        }
    })
    .catch((e) => {
        console.error(e);
    })
}

Shopify.addItem = function(variant_id, quantity, $target, callback, input = null) {
    var quantity = quantity || 1;
    let dataForm = 'quantity=' + quantity + '&id=' + variant_id;

    if ($target.closest('form')) {
        const $thisForm = $target.closest('form');
        const $properties = $thisForm.find('[name^="properties"]');
        if ($properties.length) $properties.each((index, element) => {dataForm = `${dataForm}&${$(element).attr('name')}=${$(element).val()}`})
    }

    var params = {
        type: 'POST',
        url: '/cart/add.js',
        data: dataForm,
        dataType: 'json',
        success: function(line_item) {
            if ((typeof callback) === 'function') {
                callback(line_item);
            } else {
                Shopify.onItemAdded(line_item);
            }
        },
        error: function(XMLHttpRequest, textStatus) {
            var message = window.cartStrings.addProductOutQuantity2;
            if (input.length > 0) {
                var maxValue = parseInt(input.attr('data-inventory-quantity'));
                message = getInputMessage(maxValue)
                input.val(maxValue)
            } 
            
            Shopify.onError(XMLHttpRequest, textStatus, message);
            $target.removeClass('is-loading');
        }
    };
    $.ajax(params);
}

Shopify.onItemAdded = function(line_item) {
    alert(line_item.title + ' was added to your shopping cart.');
}

Shopify.onError = function(XMLHttpRequest, textStatus, message) {
    var data = eval('(' + XMLHttpRequest.responseText + ')');
    if (!!data.message) {
        !!data.description ? showWarning(data.description) : showWarning(data.message + ': ' + message, warningTime);
    } else {
        showWarning('Error : ' + message, warningTime);
    }
}

class MenuDrawer extends HTMLElement {
    constructor() {
        super();
        this.mainDetailsToggle = this.querySelector('details');
        const summaryElements = this.querySelectorAll('summary');
        this.addAccessibilityAttributes(summaryElements);

        if (navigator.platform === 'iPhone') document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);

        this.addEventListener('keyup', this.onKeyUp.bind(this));
        this.addEventListener('focusout', this.onFocusOut.bind(this));
        this.bindEvents();
    }

    bindEvents() {
        this.querySelectorAll('summary').forEach(summary => summary.addEventListener('click', this.onSummaryClick.bind(this)));
        this.querySelectorAll('button').forEach(button => button.addEventListener('click', this.onCloseButtonClick.bind(this)));
    }

    addAccessibilityAttributes(summaryElements) {
        summaryElements.forEach(element => {
            element.setAttribute('role', 'button');
            element.setAttribute('aria-expanded', false);
            element.setAttribute('aria-controls', element.nextElementSibling.id);
        });
    }

    onKeyUp(event) {
        if(event.code.toUpperCase() !== 'ESCAPE') return;

        const openDetailsElement = event.target.closest('details[open]');
        if(!openDetailsElement) return;

        openDetailsElement === this.mainDetailsToggle ? this.closeMenuDrawer(this.mainDetailsToggle.querySelector('summary')) : this.closeSubmenu(openDetailsElement);
    }

    onSummaryClick(event) {
        const summaryElement = event.currentTarget;
        const detailsElement = summaryElement.parentNode;
        const isOpen = detailsElement.hasAttribute('open');

        if (detailsElement === this.mainDetailsToggle) {
            if(isOpen) event.preventDefault();
            isOpen ? this.closeMenuDrawer(summaryElement) : this.openMenuDrawer(summaryElement);
        } else {
            trapFocus(summaryElement.nextElementSibling, detailsElement.querySelector('button'));

            setTimeout(() => {
                detailsElement.classList.add('menu-opening');
            });
        }
    }

    openMenuDrawer(summaryElement) {
        setTimeout(() => {
            this.mainDetailsToggle.classList.add('menu-opening');
        });
        summaryElement.setAttribute('aria-expanded', true);
        trapFocus(this.mainDetailsToggle, summaryElement);
        document.body.classList.add('overflow-hidden-mobile');
    }

    closeMenuDrawer(event, elementToFocus = false) {
        if (event !== undefined) {
            this.mainDetailsToggle.classList.remove('menu-opening');

            this.mainDetailsToggle.querySelectorAll('details').forEach(details =>  {
                details.removeAttribute('open');
                details.classList.remove('menu-opening');
            });

            this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
            document.body.classList.remove('overflow-hidden-mobile');
            removeTrapFocus(elementToFocus);
            this.closeAnimation(this.mainDetailsToggle);
        }
    }

    onFocusOut(event) {
        setTimeout(() => {
            if (this.mainDetailsToggle.hasAttribute('open') && !this.mainDetailsToggle.contains(document.activeElement)) this.closeMenuDrawer();
        });
    }

    onCloseButtonClick(event) {
        const detailsElement = event.currentTarget.closest('details');
        this.closeSubmenu(detailsElement);
    }

    closeSubmenu(detailsElement) {
        detailsElement.classList.remove('menu-opening');
        removeTrapFocus();
        this.closeAnimation(detailsElement);
    }

    closeAnimation(detailsElement) {
        let animationStart;

        const handleAnimation = (time) => {
            if (animationStart === undefined) {
                animationStart = time;
            }

            const elapsedTime = time - animationStart;

            if (elapsedTime < 400) {
                window.requestAnimationFrame(handleAnimation);
            } else {
                detailsElement.removeAttribute('open');

                if (detailsElement.closest('details[open]')) {
                    trapFocus(detailsElement.closest('details[open]'), detailsElement.querySelector('summary'));
                }
            }
        }

        window.requestAnimationFrame(handleAnimation);
    }
}

customElements.define('menu-drawer', MenuDrawer);

class HeaderDrawer extends MenuDrawer {
    constructor() {
        super();
    }

    openMenuDrawer(summaryElement) {
        this.header = this.header || document.getElementById('shopify-section-header');
        this.borderOffset = this.borderOffset || this.closest('.header-wrapper').classList.contains('header-wrapper--border-bottom') ? 1 : 0;
        document.documentElement.style.setProperty('--header-bottom-position', `${parseInt(this.header.getBoundingClientRect().bottom - this.borderOffset)}px`);

        setTimeout(() => {
            this.mainDetailsToggle.classList.add('menu-opening');
        });

        summaryElement.setAttribute('aria-expanded', true);
        trapFocus(this.mainDetailsToggle, summaryElement);
        document.body.classList.add('overflow-hidden-mobile');
    }
}

customElements.define('header-drawer', HeaderDrawer);

class UpdateQuantity extends HTMLElement {
    constructor() {
        super();
        this.input = this.querySelector('input');
        this.changeCart = false;
        this.changeEvent = new Event('change', { bubbles: true })
        this.querySelectorAll('.btn-quantity').forEach(
            (button) => button.addEventListener('click', this.onButtonClick.bind(this))
        );
    }
    
    onButtonClick(event) {
        event.preventDefault();
        const $target = event.target
        let el_input = $target.parentElement.querySelector('.quantity');
        const value = Number(el_input.value);
        const inStockNumber = Number(el_input.dataset.inventoryQuantity);
        const buttonAdd = $target.closest('.product-form')?.querySelector('[data-btn-addtocart]');
        let newVal, checkAvailabel = false;

        const policyArray = document.body.matches('.quickshop-popup-show') ? window[`quick_shop_policy_array_${this.input.dataset.product}`] : window[`cart_selling_array_${this.dataset.product}`],
            currentId = document.body.matches('.quickshop-popup-show') ? this.closest('.productView-options').querySelector('[name="id"]').value : this.input.dataset.cartQuantityId,
            thisVariantStatus = policyArray[currentId];

        buttonAdd?.dataset.available == 'false' || buttonAdd?.dataset.available == undefined ? checkAvailabel = true : checkAvailabel = false;

        if ($target.matches('.plus')) newVal = value + 1;
        else if ($target.matches('.minus')) newVal = value - 1;
        else newVal = value;

        if (newVal < 0 ) newVal = 1;

        if (newVal > inStockNumber && checkAvailabel && thisVariantStatus == 'deny') {
            const message = getInputMessage(inStockNumber);
            showWarning(message, warningTime);
            newVal = inStockNumber
        }

        el_input.value = newVal;

        if (typeof this.changeCart  == 'number') {clearTimeout(this.changeCart)};
        this.changeCart = setTimeout(() => {if ($target.matches('.btn-quantity')) this.input.dispatchEvent(this.changeEvent)}, 350);
    }

    quantityCheckedToBeContinue() {
        const sellingArray = window[`cart_selling_array_${this.dataset.product}`];
        return sellingArray == undefined ? false : sellingArray[this.querySelector('[name="quantity"]').dataset.cartQuantityId] === 'continue'
    }
}

class UpdateQuantityQuickShop extends HTMLElement {
    constructor() {
        super();
        this.input = this.querySelector('input');
        this.changeEvent = new Event('change', { bubbles: true })
        this.querySelectorAll('.btn-quantity').forEach(
            (button) => button.addEventListener('click', this.onChangeQuantity.bind(this))
        );
        this.input.addEventListener('change', this.onChangeQuantity.bind(this))
    }
    
    onChangeQuantity(event) {
        event.preventDefault();
        const target = event.target;
        let el_input = target.parentElement.querySelector('.quantity');
        const value = Number(el_input.value);
        const inStockNumber = Number(el_input.dataset.inventoryQuantity);
        const buttonAdd = target.closest('[data-quickshop]').querySelector('[data-btn-addtocart]');
        let newVal;

        if (target.matches('.plus')) newVal = value + 1;
        else if (target.matches('.minus')) newVal = value - 1;
        else newVal = value;

        if (newVal <= 0) newVal = 1;

        if (newVal > inStockNumber && !buttonAdd.matches('.button--pre-untrack')) {
            const message = getInputMessage(inStockNumber);
            showWarning(message, warningTime);
            newVal = inStockNumber
        }
        
        el_input.value = newVal;
        if (target.matches('.btn-quantity')) this.input.dispatchEvent(this.changeEvent);
        const quickshop = this.closest('[data-quickshop]');
        const realQuantityInput = quickshop.querySelector('form input[type="hidden"]');
        realQuantityInput.setAttribute('value', newVal);
    }
}

class ProductScroller extends HTMLElement {
    constructor() {
        super();    
        this.container = this.querySelector('[data-drag-container]');
        this.dragParent = this.querySelector('[data-drag-parent]');

        this.initDragToScroll();
    }

    initDragToScroll() {
        const isOverflowing = (wrapper) => {
            return wrapper.clientWidth < wrapper.scrollWidth
        }
        let containerOverflowing = isOverflowing(this.container)

        if (containerOverflowing) {
            this.dragToScroll(this.container)
            return 
        }
        this.dragToScroll(this.dragParent)
    }   
    
    dragToScroll(slider) {
        let mouseDown = false;
        let start;
        let scrollLeft;
        let inactiveTimeout;

        slider.addEventListener('mousedown', (e) => {
            const target = e.target 

            mouseDown = true;
            start = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });

        slider.addEventListener('mouseup', () => {
            mouseDown = false;

            clearTimeout(inactiveTimeout)
            inactiveTimeout = setTimeout(() => {
                slider.classList.remove('active');
            }, 150)
        });

        slider.addEventListener('mousemove', (e) => {
            if(!mouseDown) return;
            e.preventDefault();

            if (!slider.classList.contains('active')) {
                slider.classList.add('active');
            }

            const x = e.pageX - slider.offsetLeft;
            const walk = (x - start) * 1; 
            slider.scrollLeft = scrollLeft - walk;
        });

        slider.addEventListener('mouseleave', () => {
            mouseDown = false;

            clearTimeout(inactiveTimeout)
            inactiveTimeout = setTimeout(() => {
                slider.classList.remove('active');
            }, 150)
        });
    }
}

class ImageToFlip extends HTMLElement {
    constructor() {
        super() 

        this.imageContainer = this; 
        this.initObserver();
    }   

    initObserver() {
        this.observer = new IntersectionObserver((entries, observer) => {
            const imageRef = entries[0]

            if (imageRef.isIntersecting) {
                imageRef.target.classList.add('show')
                observer.unobserve(imageRef.target)
            }

        }, 
        {
            threshold: 0.4 
        });
        
        this.observer.observe(this.imageContainer);
    }
}

window.addEventListener('load', () => {
    customElements.define('cart-update-quantity', UpdateQuantity);
    customElements.define('quickshop-update-quantity', UpdateQuantityQuickShop);
    customElements.define('product-scroller', ProductScroller);
    // customElements.define('image-to-flip', ImageToFlip);
})

function showWarning(content, time = null) {
    if (window.warningTimeout) {
        clearTimeout(window.warningTimeout);
    }
    const warningPopupContent = document.getElementById('halo-warning-popup').querySelector('[data-halo-warning-content]')
    warningPopupContent.textContent = content
    document.body.classList.add('has-warning')

    if (time) {
        window.warningTimeout = setTimeout(() => {
            document.body.classList.remove('has-warning')
        }, time)
    }
}

function getInputMessage(maxValue) {
    var message = window.cartStrings.addProductOutQuantity.replace('[maxQuantity]', maxValue);
    return message
}

class FadeInComponent extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.initObserver();
    }

    initObserver() {
        const handler = (entries, observer) => {
            if (entries[0].isIntersecting) {
                this.classList.add('fade-in');

                observer.unobserve(this);
            }
        }

        const options = {
            threshold: 0.7
        }

        this.observer = new IntersectionObserver(handler, options); 
        this.observer.observe(this);
    }
}

window.addEventListener('load', () => {
    customElements.define('fade-in-component', FadeInComponent);
    this.loadScrolling();
})

window.onscroll = () => {this.loadScrolling()};

function loadScrolling() {
    document.querySelectorAll('[data-scrolling]').forEach(element => {element.dataset.scrolling == 'vertical' ? this.scrollVertical(element) : this.scrollHorizontal(element)})
}

function scrollVertical(element) {
    const $thisItem = element.closest('.special-banner__item') || element,
        top = $thisItem.getBoundingClientRect().top,
        height = $thisItem.getBoundingClientRect().height,
        wdHeight = window.innerHeight,
        coefficient = element.scrollHeight/height,
        redundant = height >= wdHeight ? 0 : (wdHeight - height)/2;

    if (top - redundant < 0 && top > height*-1) this.scrollTop(element, (top*-1 + redundant)*coefficient)
    else if (top - redundant >= 0) this.scrollTop(element, 0)
    else this.scrollTop(element, element.scrollHeight)
}

function scrollTop(element, scope) {
    element.scrollTo({top: scope, behavior: "smooth"})
}

function scrollHorizontal(element) {
    const $thisFirst = element.querySelector('.scrolling-text__list--1'),
        $thisSecond = element.querySelector('.scrolling-text__list--2');

    if (!$thisFirst) return;
  
    const top = element.getBoundingClientRect().top,
        height = element.getBoundingClientRect().height,
        wdHeight = window.innerHeight,
        scrollWidth = $thisFirst.scrollWidth > window.innerWidth ? $thisFirst.scrollWidth - window.innerWidth : 0,
        contentHeight = $thisFirst.getBoundingClientRect().height*2,
        redundant = height >= wdHeight ? 0 : (wdHeight - height)/2,
        coefficient = scrollWidth/(height/2 + redundant - contentHeight);
    
    let scope = (top*-1 + redundant)*coefficient,
        scope2 = (height/2 - contentHeight + redundant)*coefficient - scope;
    
    if (top - redundant < 0 && top - contentHeight > height*-1/2) {scope = scope*-1; scope2 = scope2*-1}
    else if (top - redundant >= 0) {scope = 0; scope2 = scrollWidth*-1}
    else {scope = scrollWidth*-1; scope2 = 0}
    $thisFirst.scrollWidth <= window.innerWidth ? $thisSecond.style.justifyContent = 'flex-end' : this.translateX($thisFirst, $thisSecond, scope, scope2);
}

function translateX($thisFirst, $thisSecond, scope, scope2) {
    $thisFirst.style.transform = `translateX(${scope}px)`;
    $thisSecond.style.transform = `translateX(${(scope2)}px)`;
}

class SmoothScrollMenu {
    constructor(selector) {
        this.menuItems = document.querySelectorAll(selector);
        this.attachEvents();
        this.hideMenuItemsWithoutSection();
    }

    attachEvents() {
        this.menuItems.forEach(item => {
            const anchor = item.querySelector('a');
            if (anchor && anchor.getAttribute('href') && anchor.getAttribute('href') !== "#") {
                anchor.addEventListener('click', event => this.handleMenuItemClick(event, anchor));
            }
        });
    }

    handleMenuItemClick(event, anchor) {
        event.preventDefault();

        var targetHref = anchor.getAttribute('href');
        var shouldScroll = true;
        const location = window.location.pathname + window.location.hash;

        if (targetHref.includes('/') && location !== targetHref) {
            window.location.href = targetHref;
            shouldScroll = false;
        }

        if (shouldScroll) {
            var targetElement = document.getElementById(anchor.getAttribute('href').split('#')[1]);
            if (targetElement) {
                this.scrollToSection(targetElement);
            }
        }
    }

    scrollToSection(element) {
        this.smoothScrollTo(element);
    }

    smoothScrollTo(element) {
        window.scrollTo({
            behavior: 'smooth',
            top: element.offsetTop
        });
    }

    hideMenuItemsWithoutSection() {
        this.menuItems.forEach(item => {
            const anchor = item.querySelector('a');
            const hash = anchor.getAttribute('href').split('#')[1];
            if (hash !== undefined && hash !== '' && !document.getElementById(hash)) {
                item.style.display = 'none';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function () {
    new SmoothScrollMenu('.header__inline-menu .menu-lv-1');
    customElements.define('details-disclosure', DetailsDisclosure);
});

class DetailsDisclosure extends HTMLElement {
    constructor() {
        super();
        this.mainDetailsToggle = this.querySelector('details');

        this.addEventListener('keyup', this.onKeyUp);
        this.mainDetailsToggle.addEventListener('focusout', this.onFocusOut.bind(this));
    }

    onKeyUp(event) {
        if (event.code.toUpperCase() !== 'ESCAPE') return;

        const openDetailsElement = event.target.closest('details[open]');
        if (!openDetailsElement) return;

        const summaryElement = openDetailsElement.querySelector('summary');
        openDetailsElement.removeAttribute('open');
        summaryElement.focus();
    }

    onFocusOut() {
        setTimeout(() => {
            if (!this.contains(document.activeElement)) this.close();
        })
    }

    close() {
        this.mainDetailsToggle.removeAttribute('open')
    }
}

class AccountIcon extends HTMLElement {
  constructor() {
    super();

    this.icon = this.querySelector('.icon');
  }

  connectedCallback() {
    document.addEventListener('storefront:signincompleted', this.handleStorefrontSignInCompleted.bind(this));
  }

  handleStorefrontSignInCompleted(event) {
    if (event?.detail?.avatar) {
      this.icon?.replaceWith(event.detail.avatar.cloneNode());
    }
  }
}

customElements.define('account-icon', AccountIcon);

class PositiveVibesComponent extends HTMLElement {
    constructor() {
        super();
        this.productPositiveVibes();
    }

    productPositiveVibes() {
        const parent = this.querySelector('.text-vibes');
        const children = this.querySelectorAll('.text-vibes--child');
        let currentIndex = 0;

        if (children.length > 1) {
            const newDiv = document.createElement("div");
            newDiv.classList.add("text-vibes--child");
            newDiv.innerHTML = children[0].innerHTML;
            parent.appendChild(newDiv);
            
            const childrens = parent.querySelectorAll('.text-vibes--child');
            setInterval(() => {
                const height = childrens[currentIndex].offsetHeight;
                childrens.forEach((child, index) => {
                    parent.style.cssText = `transform: translateY(${height * -currentIndex}px); transition: all .5s ease;`;
                    if (currentIndex == 0) {
                        parent.style.cssText = `transform: translateY(${height * -currentIndex}px); transition: none;`;
                    }
                });
                currentIndex = (currentIndex + 1) % childrens.length;
                this.heightPositive();
            }, 3000);
        }
    }

    heightPositive() {
        const parent = this.querySelector('.text-vibes');
        const childrens = this.querySelectorAll('.text-vibes--child');
        
        let maxHeight = 0;
        childrens.forEach(child => {
            maxHeight = Math.max(maxHeight, child.querySelector('p').offsetHeight);
        });

        this.style.minHeight = maxHeight + 'px';

        childrens.forEach(child => {
            child.style.minHeight = `${maxHeight}px`;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    customElements.define('positive-vibes', PositiveVibesComponent);
})

function checkTransparentHeader() {
    allowTransparent();

    if (Shopify.designMode) {
        document.addEventListener("shopify:section:load", allowTransparent);
        document.addEventListener("shopify:section:unload", allowTransparent);
        document.addEventListener("shopify:section:reorder", allowTransparent);
    }
}

function allowTransparent() {
    if (document.querySelector(".shopify-section:first-child [allow-transparent-header]")) {
        return;
    } else {
        document.querySelector("body").removeAttribute("allow-transparency");
    }
}

document.addEventListener('DOMContentLoaded', function () {
    checkTransparentHeader();
});

const PUB_SUB_EVENTS = {
    cartUpdate: 'cart-update',
    quantityUpdate: 'quantity-update',
    optionValueSelectionChange: 'option-value-selection-change',
    variantChange: 'variant-change',
    cartError: 'cart-error',
};

let subscribers = {};

function subscribe(eventName, callback) {
    if (subscribers[eventName] === undefined) {
        subscribers[eventName] = [];
    }

    subscribers[eventName] = [...subscribers[eventName], callback];

    return function unsubscribe() {
        subscribers[eventName] = subscribers[eventName].filter((cb) => {
            return cb !== callback;
        });
    };
}

function publish(eventName, data) {
    if (subscribers[eventName]) {
        subscribers[eventName].forEach((callback) => {
            callback(data);
        });
    }
}

class BulkAdd extends HTMLElement {
    constructor() {
        super();
        this.queue = [];
        this.requestStarted = false;
        this.ids = [];
    }

    startQueue(id, quantity) {
        this.queue.push({ id, quantity });
        const interval = setInterval(() => {
            if (this.queue.length > 0) {
                if (!this.requestStarted) {
                    this.sendRequest(this.queue);
                }
            } else {
                clearInterval(interval);
            }
        }, 250);
    }

    sendRequest(queue) {
        this.requestStarted = true;
        const items = {};
        queue.forEach((queueItem) => {
            items[parseInt(queueItem.id)] = queueItem.quantity;
        });
        this.queue = this.queue.filter((queueElement) => !queue.includes(queueElement));
        const quickBulkElement = this.closest('quick-order-list') || this.closest('quick-add-bulk');
        quickBulkElement.updateMultipleQty(items);
    }

    resetQuantityInput(id) {
        const input = this.querySelector(`#Quantity-${id}`);
        input.value = input.getAttribute('value');
        this.isEnterPressed = false;
    }

    setValidity(event, index, message) {
        event.target.setCustomValidity(message);
        event.target.reportValidity();
        this.resetQuantityInput(index);
        event.target.select();
    }

    validateQuantity(event) {
        const inputValue = parseInt(event.target.value);
        const index = event.target.dataset.index;

        if (inputValue < event.target.dataset.min) {
            this.setValidity(event, index, window.quickOrderListStrings.min_error.replace('[min]', event.target.dataset.min));
        } else if (inputValue > parseInt(event.target.max)) {
            this.setValidity(event, index, window.quickOrderListStrings.max_error.replace('[max]', event.target.max));
        } else if (inputValue % parseInt(event.target.step) != 0) {
            this.setValidity(event, index, window.quickOrderListStrings.step_error.replace('[step]', event.target.step));
        } else {
            event.target.setCustomValidity('');
            event.target.reportValidity();
            this.startQueue(index, inputValue);
        }
    }

    getSectionsUrl() {
        if (window.pageNumber) {
            return `${window.location.pathname}?page=${window.pageNumber}`;
        } else {
            return `${window.location.pathname}`;
        }
    }

    getSectionInnerHTML(html, selector) {
        return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
    }
}

if (!customElements.get('bulk-add')) {
    customElements.define('bulk-add', BulkAdd);
}




// WALAA 10-13-2024 changing logo1 color when scrolling 

window.addEventListener('scroll', function() {
    // Get the target section element you're targeting
    let targetSection = document.querySelector('#shopify-section-template--23597726335261__custom_banner_bXCtJU');
    if (!targetSection) return; // Add null check
    
    // Get the position of the section relative to the viewport
    let sectionPosition = targetSection.getBoundingClientRect();

    // Get the logo path element inside #logo1
    let logoPath = document.querySelector('.shopify-section.shopify-section-group-header-group.section-header-navigation.shopify-section-header-sticky.animate.scrolled-past-header #logo1 svg.logo-1');
    if (!logoPath) return; // Add null check

    // Check if any part of the section is in view (top or bottom of the section is inside the viewport)
    if (sectionPosition.top < window.innerHeight && sectionPosition.bottom > 0) {
        // Section is in view, change the fill color to white
        logoPath.style.fill = '#fff';
    } else {
        // Section is out of view, revert to black
        logoPath.style.fill = 'black';
    }
});

window.addEventListener('scroll', function() {
    // Get the target section element you're targeting
    let targetSection = document.querySelector('#shopify-section-template--23597726335261__custom_banner_bXCtJU');
    if (!targetSection) return; // Add null check
    
    // Get the position of the section relative to the viewport
    let sectionPosition = targetSection.getBoundingClientRect();

    // Get all the anchor tags inside .menu-level-1
    let logoPaths = document.querySelectorAll('.menu-level-1 a');
    if (logoPaths.length === 0) return; // Add empty NodeList check

    // Check if any part of the section is in view (top or bottom of the section is inside the viewport)
    if (sectionPosition.top < window.innerHeight && sectionPosition.bottom > 0) {
        // Section is in view, change the color of all the anchors to white
        logoPaths.forEach(function(logoPath) {
            logoPath.style.color = '#fff'; // You should use `color` for text, not `fill`
        });
    } else {
        // Section is out of view, revert the color of all the anchors to black
        logoPaths.forEach(function(logoPath) {
            logoPath.style.color = 'black'; // Revert back to black
        });
    }
});

window.addEventListener('scroll', function() {
    // Get the target section element you're targeting
    let targetSection = document.querySelector('#shopify-section-template--23597726335261__custom_banner_bXCtJU');
    if (!targetSection) return; // Add null check
    
    // Get the position of the section relative to the viewport
    let sectionPosition = targetSection.getBoundingClientRect();

    // Get the logo path element inside #logo1
    let logoPath = document.querySelector('.header-navigation .header__icon--wishlist svg');
    if (!logoPath) return; // Add null check

    // Check if any part of the section is in view (top or bottom of the section is inside the viewport)
    if (sectionPosition.top < window.innerHeight && sectionPosition.bottom > 0) {
        // Section is in view, change the fill color to white
        logoPath.style.stroke = '#fff';
    } else {
        // Section is out of view, revert to black
        logoPath.style.stroke = 'black';
    }
});

// Icons 
window.addEventListener('scroll', function() {
    // Get the target section element you're targeting
    let targetSection = document.querySelector('#shopify-section-template--23597726335261__custom_banner_bXCtJU');
    if (!targetSection) return; // Add null check
    
    // Get the position of the section relative to the viewport
    let sectionPosition = targetSection.getBoundingClientRect();

    // Get all the SVG elements you want to change
    let desicons = document.querySelectorAll('svg.icon-cart.icon.m-lr-auto.w-h-26,svg.icon-globe.icon.icon.m-lr-auto.w-h-24');
    if (desicons.length === 0) return; // Add empty NodeList check

    // Check if any part of the section is in view (top or bottom of the section is inside the viewport)
    if (sectionPosition.top < window.innerHeight && sectionPosition.bottom > 0) {
        // Section is in view, change the fill color to white for each targeted SVG icon
        desicons.forEach(function(svgIcon) {
            svgIcon.style.fill = '#fff';
        });
    } else {
        // Section is out of view, revert the fill color to black for each targeted SVG icon
        desicons.forEach(function(svgIcon) {
            svgIcon.style.fill = 'black';
        });
    }
});

window.addEventListener('scroll', function() {
    // Get the target section element you're targeting
    let targetSection = document.querySelector('#shopify-section-template--23597726335261__custom_banner_bXCtJU');
    if (!targetSection) return; // Add null check
    
    // Get the position of the section relative to the viewport
    let sectionPosition = targetSection.getBoundingClientRect();

    // Get the logo path element inside #logo1
    let logoPath = document.querySelector('.menu-level-1 a');
    if (!logoPath) return; // Add null check

    // Check if any part of the section is in view (top or bottom of the section is inside the viewport)
    if (sectionPosition.top < window.innerHeight && sectionPosition.bottom > 0) {
        // Section is in view, change the fill color to white
        logoPath.style.color = '#fff';
    } else {
        // Section is out of view, revert to black
        logoPath.style.color = 'black';
    }
});

window.addEventListener('scroll', function() {
    // Get the target section element you're targeting
    let targetSection = document.querySelector('#shopify-section-template--23597726335261__custom_banner_bXCtJU');
    if (!targetSection) return; // Add null check
    
    // Get the position of the section relative to the viewport
    let sectionPosition = targetSection.getBoundingClientRect();

    // Get the logo path element inside #logo1
    let logoPath = document.querySelector('svg.modal__toggle-open.icon.icon-search.w-h-24.icon-search-custom');
    if (!logoPath) return; // Add null check

    // Check if any part of the section is in view (top or bottom of the section is inside the viewport)
    if (sectionPosition.top < window.innerHeight && sectionPosition.bottom > 0) {
        // Section is in view, change the fill color to white
        logoPath.style.fill = '#fff';
    } else {
        // Section is out of view, revert to black
        logoPath.style.fill = 'black';
    }
});

// Walaa 10-14-2024 mobile menu

window.addEventListener('scroll', function() {
    // Get the target section element you're targeting
    let targetSection = document.querySelector('#shopify-section-template--23597726335261__custom_banner_bXCtJU');
    if (!targetSection) return; // Add null check
    
    // Get the position of the section relative to the viewport
    let sectionPosition = targetSection.getBoundingClientRect();

    // Get all the SVG elements you want to change
    let svgIcons = document.querySelectorAll('svg.icon-search-1.modal__toggle-open.icon.icon-search.w-24.h-24,  svg.icon-cart.icon.shopping-basket,a.header__icon.header__icon--account.link.link--text.text-center svg#Layer_2');
    if (svgIcons.length === 0) return; // Add empty NodeList check

    // Check if any part of the section is in view (top or bottom of the section is inside the viewport)
    if (sectionPosition.top < window.innerHeight && sectionPosition.bottom > 0) {
        // Section is in view, change the fill color to white for each targeted SVG icon
        svgIcons.forEach(function(svgIcon) {
            svgIcon.style.fill = '#fff';
        });
    } else {
        // Section is out of view, revert the fill color to black for each targeted SVG icon
        svgIcons.forEach(function(svgIcon) {
            svgIcon.style.fill = 'black';
        });
    }
});

// wishlist 
window.addEventListener('scroll', function() {
    // Get the target section element you're targeting
    let targetSection = document.querySelector('#shopify-section-template--23597726335261__custom_banner_bXCtJU');
    if (!targetSection) return; // Add null check
    
    // Get the position of the section relative to the viewport
    let sectionPosition = targetSection.getBoundingClientRect();

    // Get all the SVG path elements you want to change
    let svgPaths = document.querySelectorAll('svg.icon.icon-wishlist.w-h- path');
    if (svgPaths.length === 0) return; // Add empty NodeList check

    // Check if any part of the section is in view (top or bottom of the section is inside the viewport)
    if (sectionPosition.top < window.innerHeight && sectionPosition.bottom > 0) {
        // Section is in view, change the stroke color to white for each targeted SVG path
        svgPaths.forEach(function(path) {
            path.style.stroke = '#fff';
        });
    } else {
        // Section is out of view, revert the stroke color to black for each targeted SVG path
        svgPaths.forEach(function(path) {
            path.style.stroke = 'black';
        });
    }
});
// login 


// mobile logo 
window.addEventListener('scroll', function() {
    // Get the target section element you're targeting
    let targetSection = document.querySelector('#shopify-section-template--23597726335261__custom_banner_bXCtJU');
    if (!targetSection) return; // Add null check
    
    // Get the position of the section relative to the viewport
    let sectionPosition = targetSection.getBoundingClientRect();

    // Get all the anchor tags inside .menu-level-1
    let logoPaths = document.querySelectorAll('.section-header-mobile.scrolled-past-header .header-mobile--transparent .logo1-svg');
    if (logoPaths.length === 0) return; // Add empty NodeList check

    // Check if any part of the section is in view (top or bottom of the section is inside the viewport)
    if (sectionPosition.top < window.innerHeight && sectionPosition.bottom > 0) {
        // Section is in view, change the color of all the anchors to white
        logoPaths.forEach(function(logoPath) {
            logoPath.style.color = '#fff'; // You should use `color` for text, not `fill`
        });
    } else {
        // Section is out of view, revert the color of all the anchors to black
        logoPaths.forEach(function(logoPath) {
            logoPath.style.color = 'black'; // Revert back to black
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const wishlistButtons = document.querySelectorAll('.card-product__group-item.card-wishlist');
    const preloadScreen = document.querySelector('.preload-screen');

    if (wishlistButtons.length > 0 && preloadScreen) { // Null and length check
        // Loop through each wishlist button and add the click event listener
        wishlistButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                // Show the preloading screen with !important
                preloadScreen.style.setProperty('opacity', '1', 'important');
                preloadScreen.style.setProperty('visibility', 'visible', 'important');

                // Hide the preloading screen after 1 second
                setTimeout(function() {
                    preloadScreen.style.setProperty('opacity', '0', 'important');
                    preloadScreen.style.setProperty('visibility', 'hidden', 'important');
                }, 300); // 300ms = 0.3 seconds
            });
        });
    }
});

// Mobile toggle icons
window.addEventListener('scroll', function() {
    // Get the target section element you're targeting
    let targetSection = document.querySelector('#shopify-section-template--23597726335261__custom_banner_bXCtJU');
    if (!targetSection) return; // Add null check
    
    // Get the position of the section relative to the viewport
    let sectionPosition = targetSection.getBoundingClientRect();

    // Get all the elements with the class .mobileMenu-toggle__Icon
    let toggleIcons = document.querySelectorAll('.mobileMenu-toggle__Icon, .mobileMenu-toggle__Icon:before, .mobileMenu-toggle__Icon:after');
    if (toggleIcons.length === 0) return; // Add empty NodeList check

    // Check if any part of the section is in view (top or bottom of the section is inside the viewport)
    if (sectionPosition.top < window.innerHeight && sectionPosition.bottom > 0) {
        // Section is in view, add a class to change the color to white
        toggleIcons.forEach(function(toggleIcon) {
            toggleIcon.style.backgroundColor = '#fff'; // For the main element
            toggleIcon.classList.add('in-view'); // Add class for pseudo-elements
        });
    } else {
        // Section is out of view, revert the color to black
        toggleIcons.forEach(function(toggleIcon) {
            toggleIcon.style.backgroundColor = 'black'; // For the main element
            toggleIcon.classList.remove('in-view'); // Remove class for pseudo-elements
        });
    }
});

// Walaa 10-27-2024- sort toolbar in collection page add and remove border if it open 

document.addEventListener("DOMContentLoaded", function() {
    const labelTab = document.querySelector('.label-tab.hidden-on-mobile[data-toggle="dropdown"]');

    if (labelTab) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === "attributes" && mutation.attributeName === "aria-expanded") {
                    const isExpanded = labelTab.getAttribute("aria-expanded") === "true";
                    const targetParent = document.querySelector('.toolbar-item.toolbar-sort.clearfix');
                    if (isExpanded && targetParent) {
                        targetParent.classList.add("dropdown-open");
                    } else if (targetParent) {
                        targetParent.classList.remove("dropdown-open");
                    }
                }
            });
        });

        // Configuration of the observer:
        const config = { attributes: true, attributeFilter: ["aria-expanded"] };

        // Start observing the target node for configured mutations
        observer.observe(labelTab, config);
    } else {
        console.error('The specific label tab element was not found.');
    }
});


/////



// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Select all elements with the class 'menu-level-2'
    const menus = document.querySelectorAll('.menu-level-2');

    // Function to toggle classes based on scroll position for each menu
    function toggleMenuClasses() {
        menus.forEach(menu => {
            if (window.scrollY > 0) {
                menu.classList.add('not-top-page');
                menu.classList.remove('top-page');
            } else {
                menu.classList.add('top-page');
                menu.classList.remove('not-top-page');
            }
        });
    }

    // Attach the function to the scroll event
    window.addEventListener('scroll', toggleMenuClasses);

    // Initial check in case the page is already scrolled
    toggleMenuClasses();
});


/*


document.addEventListener("DOMContentLoaded", function() {
    const labelTab = document.querySelector(".toolbar .toolbar-col .toolbar-item+.toolbar-item");

    labelTab.addEventListener("click", function() {
        // Toggle aria-expanded state
        const isExpanded = labelTab.getAttribute("aria-expanded") === "true";
        labelTab.setAttribute("aria-expanded", !isExpanded);

        // Toggle the class on the parent element
        if (!isExpanded) {
            toolbarItem.classList.add("dropdown-open");
        } else {
            toolbarItem.classList.remove("dropdown-open");
        }
    });
});

*/
/*
// Walaa hide only one product available 

document.addEventListener('DOMContentLoaded', function() {
    // Select all the fieldsets that contain product options
    const fieldsets = document.querySelectorAll('fieldset.js.product-form__input');

    // Loop through each fieldset
    fieldsets.forEach(function(fieldset) {
        // Find all available labels within the fieldset
        const availableLabels = fieldset.querySelectorAll('label.product-form__label.available');
        
        // If there is only one available label, hide it
        if (availableLabels.length === 1) {
            availableLabels[0].style.display = 'none';  // Hide the only option
        } else {
            // If there are multiple options, ensure that all are visible
            availableLabels.forEach(function(label) {
                label.style.display = '';  // Reset to default display for all labels
            });
        }
    });
});



*/


// Ahmed Yasir nav mobile


document.addEventListener("DOMContentLoaded", function() {
  // Select all menu toggles
  const menuToggles = document.querySelectorAll(".menu-toggle-mob-btn");
  const sidebars = document.querySelectorAll(".sidebar-2");
  const closeButtons = document.querySelectorAll(".close-btn");
  const overlays = document.querySelectorAll(".menu-overlay");
  

  // Loop through each menu toggle
  menuToggles.forEach(toggle => {
    toggle.addEventListener("click", function(event) {
      event.preventDefault();
            console.log("clicked")
      const menuId = toggle.getAttribute("data-menu");
      const sidebar = document.querySelector(`.sidebar-2[data-sidebar="${menuId}"]`);
      const overlay = document.querySelector(`.menu-overlay[data-overlay="${menuId}"]`);
      
      sidebar.classList.add("active");
      overlay.style.display = "block";
    });
  });

  // Loop through each close button
  closeButtons.forEach(closeBtn => {
    closeBtn.addEventListener("click", function() {
      const closeId = closeBtn.getAttribute("data-close");
      const sidebar = document.querySelector(`.sidebar-2[data-sidebar="${closeId}"]`);
      const overlay = document.querySelector(`.menu-overlay[data-overlay="${closeId}"]`);
      
      sidebar.classList.remove("active");
      overlay.style.display = "none";
    });
  });

  // Loop through each overlay
  overlays.forEach(overlay => {
    overlay.addEventListener("click", function() {
      const overlayId = overlay.getAttribute("data-overlay");
      const sidebar = document.querySelector(`.sidebar-2[data-sidebar="${overlayId}"]`);
      
      sidebar.classList.remove("active");
      overlay.style.display = "none";
    });
  });
});



// Ahmed Yasir nav accordian

document.addEventListener("DOMContentLoaded", function() {
  const toggles = document.querySelectorAll(".accordion-toggle");

  toggles.forEach(toggle => {
    toggle.addEventListener("click", function(event) {
      event.preventDefault();
      
      const level4Menu = this.nextElementSibling;
      const arrow = this.querySelector("svg path");

      // Toggle the display of the Level 4 menu
      if (level4Menu.style.display === "block") {
        level4Menu.style.display = "none";
        // Change arrow to down (default position)
        arrow.setAttribute("d", "M505.755,123.592c-8.341-8.341-21.824-8.341-30.165,0L256.005,343.176L36.421,123.592c-8.341-8.341-21.824-8.341-30.165,0 s-8.341,21.824,0,30.165l234.667,234.667c4.16,4.16,9.621,6.251,15.083,6.251c5.462,0,10.923-2.091,15.083-6.251l234.667-234.667 C514.096,145.416,514.096,131.933,505.755,123.592z");
      } else {
        level4Menu.style.display = "block";
        // Change arrow to up (open state)
        arrow.setAttribute("d", "M505.755,387.419c-8.341,8.341-21.824,8.341-30.165,0L256.005,168.832L36.421,387.419c-8.341,8.341-21.824,8.341-30.165,0 s-8.341-21.824,0-30.165l234.667-234.667c4.16-4.16,9.621-6.251,15.083-6.251c5.462,0,10.923,2.091,15.083,6.251l234.667,234.667 C514.096,365.595,514.096,379.978,505.755,387.419z");
      }
    });
  });
});




 // top seleect in hp for mobile 

function toggleDropdown() {
  if (window.innerWidth <= 768) {
    var x = document.querySelector('.tag-buttons');
    var arrow = document.getElementById('accordion-arrow');
    if (x.style.display === "none" || x.style.display === "") {
      x.style.display = "flex";
      arrow.style.transform = "rotate(180deg)"; // Rotate the arrow to indicate the dropdown is open
    } else {
      x.style.display = "none";
      arrow.style.transform = "rotate(0deg)"; // Reset rotation when closed
    }
  }
}




// Filter 

// document.addEventListener('DOMContentLoaded', function () {
//     // Select all headings in the filter sidebar
//     const headings = document.querySelectorAll('.sidebarBlock-heading');

//     headings.forEach(heading => {
//         heading.addEventListener('click', function () {
//             // Find the next sibling content block
//             const content = this.nextElementSibling;
//             if (content) {
//                 // Toggle the 'visible' class to show or hide the content
//                 content.classList.toggle('visible');
//             }
//         });
//     });
// });




// document.addEventListener('DOMContentLoaded', () => {
//     const currentURL = window.location.href;
//     const targetURLPart = 'products/cnpspkabg0p2157blue-navy';
//     const comparePriceElement = document.querySelector('.productView-price.no-js-hidden.clearfix');

//     if (currentURL.includes(targetURLPart) && comparePriceElement) {
//         comparePriceElement.style.display = 'none'; // Hide the element
//     }
// });

// Walaa 12-24-2024 Size poppup in product page 
function openModal() {
  document.getElementById("sizeGuideModal").style.display = "block";
}

function closeModal() {
  document.getElementById("sizeGuideModal").style.display = "none";
}

// Close modal if clicked outside
window.onclick = function (event) {
  const modal = document.getElementById("sizeGuideModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
};


// // Ahmed popup customization 26-12-24
    document.getElementById("modal-cusotmization").style.display = "none";
      document.getElementById("overlay-customization").style.display = "None";




  function openModalCustomization() {
  document.getElementById("modal-cusotmization").style.display = "flex";
    document.getElementById("overlay-customization").style.display = "block";
    
    console.log("hello World")
}

function closeModalCustomization() {
  document.getElementById("modal-cusotmization").style.display = "none";
      document.getElementById("overlay-customization").style.display = "None";

}



// Walaa  3-16-2025 - Bundle App Quantity 
