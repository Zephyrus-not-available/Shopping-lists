package com.kyaw.shoppingcart.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.Date;

public record ProductDto(
        Integer id,
        @NotEmpty(message = "Name must not be empty")
        String name,
        @NotEmpty(message = "Brand must not be empty")
        String brand,
        @NotEmpty(message = "Category must not be empty")
        String category,
        @Min(value = 0, message = "Price must be non-negative")
        Double price,
        @Size(min = 10, message = "Description must be at least 10 characters long")
        @Size(max = 2000, message = "Description must not exceed 2000 characters")
        String description,
        Date createdAt,
        Date updatedAt,
        String imageFileName,
        String imageBase64
) {
}
