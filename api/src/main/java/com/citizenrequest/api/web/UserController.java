package com.citizenrequest.api.web;

import com.citizenrequest.api.dto.user.UpdateUserDto;
import com.citizenrequest.api.dto.user.UserDto;
import com.citizenrequest.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  @GetMapping("/{id}")
  public UserDto findById(@PathVariable Long id) {
    return userService.findById(id);
  }

  @PutMapping("/{id}/profile")
  public UserDto updateOwnProfile(@PathVariable Long id, @RequestBody UpdateUserDto dto) {
    return userService.updateOwnProfile(id, dto);
  }
}
