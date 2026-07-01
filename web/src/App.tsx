import { Routes, Route, Navigate } from "react-router-dom";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { HomePage } from "@/pages/HomePage";
import { PlansPage } from "@/pages/PlansPage";
import { ServicesPage } from "@/pages/ServicesPage";
import { BlogPage } from "@/pages/BlogPage";
import { RSSPage } from "@/pages/RSSPage";
import { FilesPage } from "@/pages/FilesPage";
import { GitHubPage } from "@/pages/GitHubPage";
import { FusionPage } from "@/pages/FusionPage";
import { BookmarksPage } from "@/pages/BookmarksPage";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { RSSAdmin } from "@/pages/admin/RSSAdmin";
import { ServiceAdmin } from "@/pages/admin/ServiceAdmin";
import { BookmarkAdmin } from "@/pages/admin/BookmarkAdmin";
import { TodoAdmin } from "@/pages/admin/TodoAdmin";
import { FusionAdmin } from "@/pages/admin/FusionAdmin";
import SubscriptionAdmin from "@/pages/admin/SubscriptionAdmin";

function App() {
  return (
    <div className="min-h-screen">
      <AuroraBackground />
      <Routes>
        <Route path="/" element={<ErrorBoundary name="首页"><HomePage /></ErrorBoundary>} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/rss" element={<RSSPage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/github" element={<GitHubPage />} />
        <Route path="/fusion" element={<FusionPage />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="rss" replace />} />
          <Route path="rss" element={<RSSAdmin />} />
          <Route path="services" element={<ServiceAdmin />} />
          <Route path="bookmarks" element={<BookmarkAdmin />} />
          <Route path="todos" element={<TodoAdmin />} />
          <Route path="fusion" element={<FusionAdmin />} />
          <Route path="subscriptions" element={<SubscriptionAdmin />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
