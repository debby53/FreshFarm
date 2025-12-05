package com.FreshFarmPlatform.demo.model.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "farmers")
@PrimaryKeyJoinColumn(name = "user_id")
public class Farmer extends User {

    @Column(nullable = false)
    private String farmName;

    private String location;

    private String description;

    private Double rating;
}

