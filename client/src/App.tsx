import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import Home from "@/pages/home";
import AccessCode from "@/pages/access-code";
import Register from "@/pages/register";
import Quiz from "@/pages/quiz";
import Dashboard from "@/pages/dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/access" component={AccessCode} />
      <Route path="/register" component={Register} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/dashboard" component={Dashboard} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default App;
