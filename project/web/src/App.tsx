import { FC } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ChakraProvider, theme } from "@chakra-ui/react"
import { ApolloProvider } from "@apollo/client"
import { createApolloClient } from './apollo/createApolloClient';
import Main from "./pages/Main";
import Film from "./pages/Film";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";

const apolloClient = createApolloClient();

export const App:FC = () => (
  <ApolloProvider client={apolloClient}>
    <ChakraProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<Main />}/>
          <Route path="/film/:filmId" element={<Film />} />
          <Route path="/signup" element={<SignUp />}/>
          <Route path="/login" element={<Login />}/>
        </Routes>
      </Router>
    </ChakraProvider>
  </ApolloProvider>
  
)
