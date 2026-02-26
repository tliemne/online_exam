package com.example.online_exam.secutity.service;

import com.example.online_exam.user.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
//import lombok.Value;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;

@Service
public class JwtService {

//    private final String SECRET = "my-super-secret-key-my-super-secret-key";
//    private final long ACCESS_EXPIRE = 1000 * 60 * 60; // 1h
//    private final long REFRESH_EXPIRE = 1000L * 60 * 60 * 24 * 7; // 7 ngày
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-expire}")
    private long accessExpire;

    @Value("${jwt.refresh-expire}")
    private long refreshExpire;
    private Key getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    // ===== ACCESS TOKEN =====
    public String generateAccessToken(User user) {
        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim("roles",
                        user.getRoles().stream()
                                .map(r -> r.getName().name())
                                .toList()
                )
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + accessExpire))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ===== REFRESH TOKEN =====
    public String generateRefreshToken(User user) {
        return Jwts.builder()
                .setSubject(user.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshExpire))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ===== EXTRACT EMAIL =====
    public String extractEmail(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    // ===== VALIDATE TOKEN =====
    public boolean isValid(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }
    private boolean isTokenExpired(String token) {
        return extractAllClaims(token)
                .getExpiration()
                .before(new Date());
    }
    public boolean isTokenValid(String token, User user) {
        String email = extractUsername(token);
        return email.equals(user.getEmail()) && !isTokenExpired(token);
    }
}