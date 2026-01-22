package com.kyaw.shoppingcart.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping({"/", "/index", "/home", "/shopping-list.html"})
    public String index() {
        return "shopping-list";
    }
}
