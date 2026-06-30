import './App.css';
import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import StorefrontRedirect from './components/StorefrontRedirect';
import AdminHome from './components/Admin/AdminHome';
import ManageProducts from './components/Admin/ManageProducts';
import ManageUsers from './components/Admin/ManageUsers';
import ManageOrders from './components/Admin/ManageOrders';
import AdminEditProduct from './components/Admin/AdminEditProduct';
import AdminAddProduct from './components/Admin/AdminAddProduct';
import AdminProductDetails from './components/Admin/AdminProductDetails';
import ManageCategories from './components/Admin/ManageCategories';
import ManageRoles from './components/Admin/ManageRoles';
import ManageCoupons from './components/Admin/ManageCoupons';
import ManageReviews from './components/Admin/ManageReviews';
import AdminCategoryForm from './components/Admin/AdminCategoryForm';
import AdminRoleForm from './components/Admin/AdminRoleForm';
import AdminUserForm from './components/Admin/AdminUserForm';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<ProtectedAdminRoute />}>
        <Route path="/admin-home" element={<AdminHome />} />
        <Route path="/admin-products" element={<ManageProducts />} />
        <Route path="/admin-users" element={<ManageUsers />} />
        <Route path="/admin-users-add" element={<AdminUserForm />} />
        <Route path="/admin-users-edit/:id" element={<AdminUserForm />} />
        <Route path="/admin-orders" element={<ManageOrders />} />
        <Route path="/admin-categories" element={<ManageCategories />} />
        <Route path="/admin-categories-add" element={<AdminCategoryForm />} />
        <Route path="/admin-categories-edit/:id" element={<AdminCategoryForm />} />
        <Route path="/admin-roles" element={<ManageRoles />} />
        <Route path="/admin-roles-add" element={<AdminRoleForm />} />
        <Route path="/admin-roles-edit/:id" element={<AdminRoleForm />} />
        <Route path="/admin-coupons" element={<ManageCoupons />} />
        <Route path="/admin-reviews" element={<ManageReviews />} />
        <Route path="/users/:id/orders" element={<Navigate to="/admin-orders" replace />} />
        <Route path="/admin-products-add" element={<AdminAddProduct />} />
        <Route path="/admin-products-edit/:id" element={<AdminEditProduct />} />
        <Route path="/admin-product-view/:id" element={<AdminProductDetails />} />
        <Route path="/admin/order/:orderId/track" element={<Navigate to="/admin-orders" replace />} />
      </Route>

      <Route path="/user-register" element={<StorefrontRedirect destination="/signin" />} />
      <Route path="/user-cart" element={<StorefrontRedirect destination="/cart" />} />
      <Route path="/user-checkout" element={<StorefrontRedirect destination="/checkout" />} />
      <Route path="/user-orders" element={<StorefrontRedirect destination="/track-order" />} />
      <Route path="/user-products" element={<StorefrontRedirect destination="/shop-with-sidebar" />} />
      <Route path="/user-productdetail/:id" element={<StorefrontRedirect destination="/shop-details" productQuery />} />
      <Route path="/user-wishlist" element={<StorefrontRedirect destination="/wishlist" />} />
      <Route path="/payment/:orderId" element={<StorefrontRedirect destination="/track-order" orderQuery />} />
      <Route path="/track/:orderId" element={<StorefrontRedirect destination="/track-order" orderQuery />} />
      <Route path="/checkout/:id" element={<StorefrontRedirect destination="/shop-details" productQuery />} />
      <Route path="/user-profile" element={<StorefrontRedirect destination="/my-account" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
