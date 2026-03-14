package com.example.online_exam.secutity.service;

import com.example.online_exam.user.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-expire}")
    private long accessExpire;

    @Value("${jwt.refresh-expire}")
    private long refreshExpire;

    private Key getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    // Subject = username (luôn tồn tại, không bị null như email)
    public String generateAccessToken(User user) {
        return Jwts.builder()
                .setSubject(user.getUsername())
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

    public String generateRefreshToken(User user) {
        return Jwts.builder()
                .setSubject(user.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshExpire))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, User user) {
        String username = extractUsername(token);
        return username != null && username.equals(user.getUsername()) && !isTokenExpired(token);
    }

    public boolean isValid(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(getKey()).build().parseClaimsJws(token);
            return true;
        } catch (JwtException e) { return false; }
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey()).build()
                .parseClaimsJws(token).getBody();
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }
}