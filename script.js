
const ProductType = {
    create: function(id, title, price, tva, ads, reduction, category) {
        return {
            id: id,
            title: title,
            price: parseFloat(price) || 0,
            tva: parseFloat(tva) || 0,
            ads: parseFloat(ads) || 0,
            reduction: parseFloat(reduction) || 0,
            category: category
        };
    }
};

const DOMSelectorType = {
    inputs: {
        title: () => document.querySelector('input[placeholder="titre"]'),
        price: () => document.querySelector('input[placeholder="prix"]'),
        tva: () => document.querySelector('input[placeholder="tva"]'),
        ads: () => document.querySelector('input[placeholder="ads"]'),
        reduction: () => document.querySelector('input[placeholder="reduction"]'),
        count: () => document.querySelector('input[placeholder="compte"]'),
        category: () => document.querySelector('input[placeholder="categorie"]'),
        search: () => document.querySelector('input[placeholder="rechercher"]')
    },
    elements: {
        total: () => document.querySelector('.total'),
        tableBody: () => document.querySelector('tbody'),
        createButton: () => document.querySelector('.create'),
        resetButton: () => document.querySelector('.reset'),
        searchTitleButton: () => document.querySelector('.search-buttons button:nth-child(1)'),
        searchCategoryButton: () => document.querySelector('.search-buttons button:nth-child(2)')
    }
};

const CalculationType = {
    calculateTotal: function(price, tva, ads, discount) {
        return {
            total: price + tva + ads - discount,
            isValid: price > 0
        };
    }
};

const ProductManagerType = {
    products: [],
    searchMode: 'title',
    lastUsedId: 0,

    // Local Storage Management
    loadFromStorage: function() {
        try {
            const savedProducts = localStorage.getItem('products');
            const savedLastId = localStorage.getItem('lastUsedId');
            const savedSearchMode = localStorage.getItem('searchMode');
            
            this.products = savedProducts ? JSON.parse(savedProducts) : [];
            this.lastUsedId = savedLastId ? parseInt(savedLastId) : 0;
            this.searchMode = savedSearchMode || 'title';
        } catch (error) {
            console.error('Error loading from storage:', error);
            this.products = [];
            this.lastUsedId = 0;
            this.searchMode = 'title';
        }
    },

    saveToStorage: function() {
        try {
            localStorage.setItem('products', JSON.stringify(this.products));
            localStorage.setItem('lastUsedId', this.lastUsedId.toString());
            localStorage.setItem('searchMode', this.searchMode);
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    },

    getNextId: function() {
        this.lastUsedId++;
        this.saveToStorage();
        return this.lastUsedId;
    },

    addProduct: function(product, count = 1) {
        for (let i = 0; i < count; i++) {
            const newProduct = {
                ...product,
                id: this.getNextId()
            };
            this.products.push(newProduct);
        }
        this.saveToStorage();
        return this.products;
    },

    deleteProduct: function(id) {
        this.products = this.products.filter(product => product.id !== id);
        this.saveToStorage();
        return this.products;
    },

    findProduct: function(id) {
        return this.products.find(p => p.id === id);
    },

    setSearchMode: function(mode) {
        this.searchMode = mode;
        this.saveToStorage();
    },

    searchProducts: function(keyword) {
        if (!keyword) return this.products;
        
        const searchTerm = keyword.toLowerCase();
        return this.products.filter(product => {
            if (this.searchMode === 'title') {
                return product.title.toLowerCase().includes(searchTerm);
            } else {
                return product.category.toLowerCase().includes(searchTerm);
            }
        });
    }
};

const UIHandlerType = {
    updateTotalDisplay: function(totalInfo) {
        const totalElement = DOMSelectorType.elements.total();
        totalElement.textContent = totalInfo.isValid ? `Total : ${totalInfo.total}` : 'Total :';
        totalElement.style.backgroundColor = totalInfo.isValid ? 'green' : 'red';
    },

    clearInputs: function() {
        Object.values(DOMSelectorType.inputs).forEach(selector => {
            const element = selector();
            if (element && element.tagName === 'INPUT') {
                element.value = '';
            }
        });
        this.updateTotalDisplay({ isValid: false });
    },

    renderProducts: function(products) {
        const tableBody = DOMSelectorType.elements.tableBody();
        tableBody.innerHTML = '';

        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.title}</td>
                <td>${product.price}</td>
                <td>${product.tva}</td>
                <td>${product.ads}</td>
                <td>${product.reduction}</td>
                <td>${product.category}</td>
                <td><button onclick="updateProduct(${product.id})">Update</button></td>
                <td><button onclick="deleteProduct(${product.id})">Delete</button></td>
            `;
            tableBody.appendChild(row);
        });
    }
};

// Event Handlers
function initializeEventListeners() {
    const inputs = DOMSelectorType.inputs;
    const elements = DOMSelectorType.elements;

    // Live search handler
    inputs.search().addEventListener('input', (e) => {
        const results = ProductManagerType.searchProducts(e.target.value);
        UIHandlerType.renderProducts(results);
    });

    // Calculate total on input changes
    ['price', 'tva', 'ads', 'reduction'].forEach(field => {
        inputs[field]().addEventListener('input', () => {
            const totalInfo = CalculationType.calculateTotal(
                parseFloat(inputs.price().value) || 0,
                parseFloat(inputs.tva().value) || 0,
                parseFloat(inputs.ads().value) || 0,
                parseFloat(inputs.reduction().value) || 0
            );
            UIHandlerType.updateTotalDisplay(totalInfo);
        });
    });

    // Create button handler
    elements.createButton().addEventListener('click', () => {
        const product = ProductType.create(
            ProductManagerType.products.length + 1,
            inputs.title().value,
            inputs.price().value,
            inputs.tva().value,
            inputs.ads().value,
            inputs.reduction().value,
            inputs.category().value
        );

        const count = parseInt(inputs.count().value) || 1;
        ProductManagerType.addProduct(product, count);
        UIHandlerType.renderProducts(ProductManagerType.products);
        UIHandlerType.clearInputs();
    });

    // Reset button handler
    elements.resetButton().addEventListener('click', () => UIHandlerType.clearInputs());

    // Search mode buttons
    elements.searchTitleButton().addEventListener('click', () => {
        ProductManagerType.setSearchMode('title');
        const results = ProductManagerType.searchProducts(inputs.search().value);
        UIHandlerType.renderProducts(results);
    });

    elements.searchCategoryButton().addEventListener('click', () => {
        ProductManagerType.setSearchMode('category');
        const results = ProductManagerType.searchProducts(inputs.search().value);
        UIHandlerType.renderProducts(results);
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    ProductManagerType.loadFromStorage();
    UIHandlerType.renderProducts(ProductManagerType.products);
    initializeEventListeners();
});

// Global functions for HTML button events
window.deleteProduct = function(id) {
    const updatedProducts = ProductManagerType.deleteProduct(id);
    UIHandlerType.renderProducts(updatedProducts);
};

window.updateProduct = function(id) {
    const product = ProductManagerType.findProduct(id);
    if (product) {
        const inputs = DOMSelectorType.inputs;
        inputs.title().value = product.title;
        inputs.price().value = product.price;
        inputs.tva().value = product.tva;
        inputs.ads().value = product.ads;
        inputs.reduction().value = product.reduction;
        inputs.category().value = product.category;

        const totalInfo = CalculationType.calculateTotal(
            product.price,
            product.tva,
            product.ads,
            product.reduction
        );
        UIHandlerType.updateTotalDisplay(totalInfo);

        ProductManagerType.deleteProduct(id);
        UIHandlerType.renderProducts(ProductManagerType.products);
    }
};