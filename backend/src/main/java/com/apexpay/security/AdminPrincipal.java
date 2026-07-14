package com.apexpay.security;

import com.apexpay.entity.admin.AdminUser;
import com.apexpay.entity.admin.AdminRole;
import com.apexpay.entity.admin.Permission;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Getter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class AdminPrincipal implements UserDetails {

    @EqualsAndHashCode.Include
    private final UUID id;
    private final String fullName;
    private final String username;
    private final String email;

    @JsonIgnore
    private final String password;

    private final Collection<? extends GrantedAuthority> authorities;

    public AdminPrincipal(UUID id, String fullName, String username, String email, String password,
                          Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.fullName = fullName;
        this.username = username;
        this.email = email;
        this.password = password;
        this.authorities = authorities;
    }

    public static AdminPrincipal create(AdminUser adminUser) {
        List<GrantedAuthority> authorities = new ArrayList<>();

        for (AdminRole role : adminUser.getRoles()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getName()));
            for (Permission perm : role.getPermissions()) {
                String authName = "PERMISSION_" + perm.getName().replace(" ", "_").toUpperCase();
                authorities.add(new SimpleGrantedAuthority(authName));
            }
        }

        return new AdminPrincipal(
                adminUser.getId(),
                adminUser.getFullName(),
                adminUser.getUsername(),
                adminUser.getEmail(),
                adminUser.getPasswordHash(),
                authorities
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
