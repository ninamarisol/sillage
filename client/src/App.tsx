import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/lib/theme";
import Home from "@/pages/home";
import AccessCode from "@/pages/access-code";
import Register from "@/pages/register";
import Quiz from "@/pages/quiz";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Feed from "@/pages/feed";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/access" component={AccessCode} />
      <Route path="/register" component={Register} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/feed" component={Feed} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
