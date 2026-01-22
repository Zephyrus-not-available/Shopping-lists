package com.kyaw.shoppingcart.service;

import com.kyaw.shoppingcart.dto.ProductDto;
import com.kyaw.shoppingcart.repositorys.ProductsRepository;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProductService {
    private final ProductsRepository productsRepository;
    private final ProductMapper productMapper;
    private final Path uploadDir;

    public ProductService(ProductsRepository productsRepository, ProductMapper productMapper) {
        this.productsRepository = productsRepository;
        this.productMapper = productMapper;
        this.uploadDir = Paths.get("uploads");
        initUploadDir();
    }

    public ProductDto createProduct(
             ProductDto productDto) {
        var product = productMapper.toProductEntity(productDto);
        var storedFile = storeImage(productDto.imageBase64(), productDto.imageFileName());
        if (storedFile != null) {
            product.setImageFileName(storedFile);
        }
        var savedProduct = productsRepository.save(product);
        return productMapper.toProductDto(savedProduct);

    }

    public List<ProductDto> getAllProducts() {
        var products = productsRepository.findAll();
        return products.stream()
                .map(productMapper::toProductDto)
                .collect(Collectors.toList());
    }

    public void deleteProduct(Integer id) {
        var product = productsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + id));
        deleteImageFile(product.getImageFileName());
        productsRepository.delete(product);
    }

    private void initUploadDir() {
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            throw new IllegalStateException("Unable to initialize upload directory", e);
        }
    }

    private String storeImage(String base64Data, String originalName) {
        if (base64Data == null || base64Data.isBlank()) {
            return null;
        }
        try {
            String payload = base64Data;
            String extension = "png";
            if (payload.contains(",")) {
                String[] parts = payload.split(",", 2);
                payload = parts[1];
                extension = extractExtension(parts[0], extension);
            }
            byte[] bytes = Base64.getDecoder().decode(payload);
            String fileName = buildFileName(originalName, extension);
            Files.write(uploadDir.resolve(fileName), bytes);
            return fileName;
        } catch (IllegalArgumentException | IOException e) {
            throw new IllegalStateException("Unable to store image", e);
        }
    }

    private void deleteImageFile(String storedName) {
        if (storedName == null || storedName.isBlank()) {
            return;
        }
        String cleanName = storedName.replace("\\", "/");
        if (cleanName.contains("/")) {
            cleanName = cleanName.substring(cleanName.lastIndexOf('/') + 1);
        }
        Path file = uploadDir.resolve(cleanName);
        try {
            Files.deleteIfExists(file);
        } catch (IOException ignored) {
        }
    }

    private String buildFileName(String originalName, String extension) {
        String base = (originalName != null && !originalName.isBlank())
                ? originalName
                : UUID.randomUUID().toString();
        base = base.replaceAll("[^A-Za-z0-9._-]", "_");
        if (!base.contains(".")) {
            base = base + "." + extension;
        }
        return UUID.randomUUID().toString().replace("-", "") + "_" + base;
    }

    private String extractExtension(String header, String fallback) {
        if (header == null) {
            return fallback;
        }
        int slash = header.indexOf('/');
        int semi = header.indexOf(';');
        if (slash != -1 && semi != -1 && semi > slash) {
            return header.substring(slash + 1, semi);
        }
        return fallback;
    }

}
