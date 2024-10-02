import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, ShoppingCart, AlertTriangle, ChefHat, Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:5000';
function LoginSignup({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/login' : '/register';
    const body = isLogin
      ? { username, password }
      : { username, password, phone_number: phoneNumber };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        if (isLogin) {
          localStorage.setItem('token', data.access_token);
          onLogin();
        } else {
          setIsLogin(true);
          alert('Registration successful. Please log in.');
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>{isLogin ? 'Login' : 'Sign Up'}</CardHeader>
      <CardContent className="grid gap-2">
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="mb-2"
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="mb-2"
          />
          {!isLogin && (
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Phone Number"
              className="mb-2"
            />
          )}
          <Button type="submit">{isLogin ? 'Login' : 'Sign Up'}</Button>
        </form>
        <Button onClick={() => setIsLogin(!isLogin)} className="mt-2">
          {isLogin ? 'Need an account? Sign Up' : 'Have an account? Log In'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function SmartGroceryList() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [groceryList, setGroceryList] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [shelfLife, setShelfLife] = useState('');
  const [expiringItems, setExpiringItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [shoppingHistory, setShoppingHistory] = useState([]);
  const isTokenExpired = (token) => {
    if (!token) return true;
    const decoded = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  };
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isTokenExpired(token)) {
      setIsLoggedIn(true);
      fetchGroceryList();
      fetchExpiringItems();
      fetchShoppingHistory();
    } else {
      setIsLoggedIn(false);
      localStorage.removeItem('token');
    }
  }, []);
  

  const fetchGroceryList = async () => {
    const response = await fetch(`${API_URL}/get_list/1`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });    
    const data = await response.json();
    setGroceryList(data);
  };

  const fetchExpiringItems = async () => {
    const response = await fetch(`${API_URL}/get_expiring_soon/1`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });    const data = await response.json();
    setExpiringItems(data);
  };

  const fetchShoppingHistory = async () => {
    const response = await fetch(`${API_URL}/get_shopping_history/1`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });    const data = await response.json();
    setShoppingHistory(data);
  };
  const addItem = async () => {
    if (!newItem || !shelfLife) return;
    await fetch(`${API_URL}/add_item`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ name: newItem, shelf_life: parseInt(shelfLife), user_id: 1 }),
    });
    setNewItem('');
    setShelfLife('');
    fetchGroceryList();
    fetchExpiringItems();
    fetchShoppingHistory();

  };

  const deleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    await fetch(`${API_URL}/delete_item/${itemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    setGroceryList(prevList => prevList.filter(item => item.id !== itemId));
    setExpiringItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const fetchRecipes = async () => {
    const ingredients = groceryList.map(item => item.name).join(',');
    const response = await fetch(`${API_URL}/get_recipes?ingredients=${ingredients}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });    
    const data = await response.json();
    setRecipes(data.slice(0, 3));
  };
  if (!isLoggedIn) {
    return <LoginSignup onLogin={() => setIsLoggedIn(true)} />;
  }
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Smart Grocery List</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add New Item</h2>
              <PlusCircle className="text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Item name"
                />
                <Input
                  type="number"
                  value={shelfLife}
                  onChange={(e) => setShelfLife(e.target.value)}
                  placeholder="Shelf life (days)"
                />
                <Button onClick={addItem} className="w-full">Add Item</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Grocery List</h2>
              <ShoppingCart className="text-blue-500" />
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {groceryList.map((item) => (
                  <li key={item.id} className="flex justify-between items-center">
                    <span>{item.name}</span>
                    <span className="text-sm text-gray-500">
                      Expires: {new Date(item.expiry_date).toLocaleDateString()}
                    </span>
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        <Card className="mb-4">
        <CardHeader>Expiring Soon</CardHeader>
        <CardContent>
          {expiringItems.map((item) => (
            <Alert key={item.id} variant="destructive">
              <AlertDescription>
                {item.name} expires on {new Date(item.expiry_date).toLocaleDateString()}
              </AlertDescription>
            </Alert>
          ))}
          <Alert className="mt-2">
            <AlertDescription>
              You will automatically receive notifications for items expiring soon.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

        <div className="text-center">
          <Button onClick={fetchRecipes} className="mb-6">
            <ChefHat className="mr-2" />
            Get Recipe Suggestions
          </Button>
        </div>

        {recipes.length > 0 && (
          <Card className="shadow-md">
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recipe Suggestions</h2>
              <ChefHat className="text-purple-500" />
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recipes.map((recipe) => (
                  <li key={recipe.id} className="text-gray-700">{recipe.title}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}