package com.citizenrequest.api.config;

import com.citizenrequest.api.domain.User;
import com.citizenrequest.api.domain.UserRole;
import com.citizenrequest.api.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

// @Component intentionally removed — replaced by JwtAuthenticationFilter
@RequiredArgsConstructor
public class HeaderAuthenticationFilter extends OncePerRequestFilter {

  private final UserRepository userRepository;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String userIdHeader = request.getHeader("X-User-Id");
    String roleHeader = request.getHeader("X-User-Role");

    if (userIdHeader != null
        && roleHeader != null
        && !userIdHeader.isBlank()
        && !roleHeader.isBlank()) {
      try {
        Long userId = Long.parseLong(userIdHeader);
        UserRole claimedRole = UserRole.valueOf(roleHeader.trim());

        User user =
            userRepository
                .findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));

        if (user.getRole() == claimedRole) {
          UsernamePasswordAuthenticationToken authentication =
              new UsernamePasswordAuthenticationToken(
                  user.getId(),
                  null,
                  List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
          SecurityContextHolder.getContext().setAuthentication(authentication);
        }
      } catch (Exception ignored) {
        SecurityContextHolder.clearContext();
      }
    }

    filterChain.doFilter(request, response);
  }
}
