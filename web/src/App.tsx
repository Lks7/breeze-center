import { Routes, Route, Navigate } from "react-router-dom";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { HomePage } from "@/pages/HomePage";
import { PlansPage } from "@/pages/PlansPage";
import { ServicesPage } from "@/pages/ServicesPage";
import { BlogPage } from "@/pages/BlogPage";
import { BookmarksPage } from "@/pages/BookmarksPage";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { BlogAdmin } from "@/pages/admin/BlogAdmin";
import { RSSAdmin } from "@/pages/admin/RSSAdmin";
import { ServiceAdmin } from "@/pages/admin/ServiceAdmin";
import { BookmarkAdmin } from "@/pages/admin/BookmarkAdmin";
import { TodoAdmin } from "@/pages/admin/TodoAdmin";

function App() {
  return (
    <div className="min-h-screen">
      <AuroraBackground />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="blog" replace />} />
          <Route path="blog" element={<BlogAdmin />} />
          <Route path="rss" element={<RSSAdmin />} />
          <Route path="services" element={<ServiceAdmin />} />
          <Route path="bookmarks" element={<BookmarkAdmin />} />
          <Route path="todos" element={<TodoAdmin />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
