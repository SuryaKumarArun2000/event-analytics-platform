
import { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import analytics from "./analytics/analytics";

const menuItems = [
  { id: 1, name: "Paneer Tikka", price: 249, category: "Starter" },
  { id: 2, name: "Veg Biryani", price: 199, category: "Main Course" },
  { id: 3, name: "Butter Paneer", price: 279, category: "Main Course" },
  { id: 4, name: "Chocolate Brownie", price: 129, category: "Dessert" }
];


function PageTracker() {
  const location = useLocation();
  const lastPath = useRef(null);

  useEffect(() => {
    analytics.init({
      apiUrl: "http://localhost:5000"
    });

    if (lastPath.current !== location.pathname) {
      lastPath.current = location.pathname;
      analytics.pageView();
    }
  }, [location.pathname]);

  return null;
}


function Home() {
  return (
    <main>
      <h1>Surya's Den</h1>
      <p>Fresh flavours, delicious food, made with love.</p>
      <p>Discover our menu and find your next favourite meal.</p>

      <Link to="/menu">Explore Our Menu</Link>
    </main>
  );
}

function Menu({ addToCart }) {
  return (
    <main>
      <h1>Our Menu</h1>
      <p>Choose something delicious.</p>

      {menuItems.map((item) => (
        <div key={item.id}>
          <h3>{item.name}</h3>
          <p>{item.category}</p>
          <p>₹{item.price}</p>

          <button onClick={() => addToCart(item)}>
            Add to Cart
          </button>
        </div>
      ))}
    </main>
  );
}

function Cart({ cart }) {
  const navigate = useNavigate();

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <main>
      <h1>Your Cart</h1>

      {cart.length === 0 ? (
        <>
          <p>Your cart is empty.</p>
          <Link to="/menu">Browse Menu</Link>
        </>
      ) : (
        <>
          {cart.map((item) => (
            <div key={item.id}>
              <p>
                {item.name} × {item.quantity} — ₹
                {item.price * item.quantity}
              </p>
            </div>
          ))}

          <h3>Total: ₹{total}</h3>

          <button onClick={() => navigate("/checkout")}>
            Proceed to Checkout
          </button>
        </>
      )}
    </main>
  );
}

function Checkout({ cart }) {
  const navigate = useNavigate();

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );



async function handleCheckout() {
  try {
    const { visitorId, sessionId } = analytics.getContext();

    const response = await fetch("http://localhost:5000/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        visitorId,
        sessionId,
        items: cart.map((item) => ({
          itemId: item.id,
          quantity: item.quantity
        }))
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Order creation failed");
    }

    alert(`Order created successfully!\nOrder ID: ${result.data.orderId}`);
  } catch (error) {
    console.error("Checkout failed:", error);
    alert(error.message || "Unable to place order. Please try again.");
  }
}

  return (
    <main>
      <h1>Checkout</h1>
      <p>Order total: ₹{total}</p>

      {cart.length === 0 ? (
        <p>Your cart is empty. <Link to="/menu">Browse Menu</Link></p>
      ) : (
        <button onClick={handleCheckout}>
          Place Order
        </button>
      )}

      <button onClick={() => navigate("/cart")}>
        Back to Cart
      </button>
    </main>
  );
}

function RestaurantApp() {
  const [cart, setCart] = useState([]);
  const location = useLocation();

  // useEffect(() => {
  //   analytics.init({
  //     apiUrl: "http://localhost:5000"
  //   });
  // }, []);

  function addToCart(item) {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (cartItem) => cartItem.id === item.id
      );

      if (existing) {
        return currentCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      return [...currentCart, { ...item, quantity: 1 }];
    });

    analytics.track("add_to_cart", {
      itemId: item.id,
      itemName: item.name,
      price: item.price
    });
  }

  return (
    <>
      <PageTracker />

      <nav>
        <Link to="/">Home</Link>{" | "}
        <Link to="/menu">Menu</Link>{" | "}
        <Link to="/cart">
          Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
        </Link>{" | "}
        <Link to="/dashboard" className="dashboard-link">
          Analytics Dashboard
        </Link>
      </nav>

      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route
          path="/menu"
          element={<Menu addToCart={addToCart} />}
        />
        <Route path="/cart" element={<Cart cart={cart} />} />
        <Route
          path="/checkout"
          element={<Checkout cart={cart} />}
        />
        <Route path="/dashboard" element={<Dashboard />} />

      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <RestaurantApp />
    </BrowserRouter>
  );
}

export default App;
