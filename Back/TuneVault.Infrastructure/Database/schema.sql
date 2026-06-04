
/* UserProfiles */
CREATE TABLE UserProfiles (
    Id          UNIQUEIDENTIFIER NOT NULL,
    UserName    NVARCHAR(MAX)    NOT NULL,
    Email       NVARCHAR(MAX)    NOT NULL,
    CreatedAt   DATETIME2        NOT NULL,
    CONSTRAINT PK_UserProfiles PRIMARY KEY (Id)
);

/* MediaItems */
CREATE TABLE MediaItems (
    Id              UNIQUEIDENTIFIER NOT NULL,
    Title           NVARCHAR(MAX)    NOT NULL,
    Artist          NVARCHAR(MAX)    NOT NULL,
    FilePath        NVARCHAR(MAX)    NOT NULL,
    MediaType       INT              NOT NULL,
    DurationSeconds INT              NOT NULL,
    CreatedAt       DATETIME2        NOT NULL,
    OwnerId         UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT PK_MediaItems PRIMARY KEY (Id),
    CONSTRAINT FK_MediaItems_UserProfiles_OwnerId
        FOREIGN KEY (OwnerId) REFERENCES UserProfiles (Id) ON DELETE CASCADE
);
CREATE INDEX IX_MediaItems_OwnerId ON MediaItems (OwnerId);

/* Playlists */
CREATE TABLE Playlists (
    Id        UNIQUEIDENTIFIER NOT NULL,
    Name      NVARCHAR(MAX)    NOT NULL,
    isPublic  BIT              NOT NULL,
    CreatedAt DATETIME2        NOT NULL,
    OwnerId   UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT PK_Playlists PRIMARY KEY (Id),
    CONSTRAINT FK_Playlists_UserProfiles_OwnerId
        FOREIGN KEY (OwnerId) REFERENCES UserProfiles (Id) ON DELETE CASCADE
);
CREATE INDEX IX_Playlists_OwnerId ON Playlists (OwnerId);

/* Follows */
CREATE TABLE Follows (
    FollowerId UNIQUEIDENTIFIER NOT NULL,
    FollowedId UNIQUEIDENTIFIER NOT NULL,
    FollowedAt DATETIME2        NOT NULL,
    CONSTRAINT PK_Follows PRIMARY KEY (FollowerId, FollowedId),
    CONSTRAINT FK_Follows_UserProfiles_FollowerId
        FOREIGN KEY (FollowerId) REFERENCES UserProfiles (Id),
    CONSTRAINT FK_Follows_UserProfiles_FollowedId
        FOREIGN KEY (FollowedId) REFERENCES UserProfiles (Id)
);
CREATE INDEX IX_Follows_FollowedId ON Follows (FollowedId);

/* Notifications */
CREATE TABLE Notifications (
    Id        UNIQUEIDENTIFIER NOT NULL,
    UserId    UNIQUEIDENTIFIER NOT NULL,
    Type      INT              NOT NULL,
    Message   NVARCHAR(MAX)    NOT NULL,
    IsRead    BIT              NOT NULL,
    CreatedAt DATETIME2        NOT NULL,
    CONSTRAINT PK_Notifications PRIMARY KEY (Id),
    CONSTRAINT FK_Notifications_UserProfiles_UserId
        FOREIGN KEY (UserId) REFERENCES UserProfiles (Id) ON DELETE CASCADE
);
CREATE INDEX IX_Notifications_UserId ON Notifications (UserId);

/* Favourites (khoa chinh kep) */
CREATE TABLE Favourites (
    UserId      UNIQUEIDENTIFIER NOT NULL,
    MediaItemId UNIQUEIDENTIFIER NOT NULL,
    AddedAt     DATETIME2        NOT NULL,
    CONSTRAINT PK_Favourites PRIMARY KEY (UserId, MediaItemId),
    CONSTRAINT FK_Favourites_UserProfiles_UserId
        FOREIGN KEY (UserId) REFERENCES UserProfiles (Id) ON DELETE CASCADE,
    CONSTRAINT FK_Favourites_MediaItems_MediaItemId
        FOREIGN KEY (MediaItemId) REFERENCES MediaItems (Id)
);
CREATE INDEX IX_Favourites_MediaItemId ON Favourites (MediaItemId);

/* MediaShares */
CREATE TABLE MediaShares (
    Id             UNIQUEIDENTIFIER NOT NULL,
    MediaItemId    UNIQUEIDENTIFIER NOT NULL,
    SharedByUserId UNIQUEIDENTIFIER NOT NULL,
    SharedToUserId UNIQUEIDENTIFIER NOT NULL,
    SharedAt       DATETIME2        NOT NULL,
    CONSTRAINT PK_MediaShares PRIMARY KEY (Id),
    CONSTRAINT FK_MediaShares_MediaItems_MediaItemId
        FOREIGN KEY (MediaItemId) REFERENCES MediaItems (Id) ON DELETE CASCADE,
    CONSTRAINT FK_MediaShares_UserProfiles_SharedByUserId
        FOREIGN KEY (SharedByUserId) REFERENCES UserProfiles (Id),
    CONSTRAINT FK_MediaShares_UserProfiles_SharedToUserId
        FOREIGN KEY (SharedToUserId) REFERENCES UserProfiles (Id)
);
CREATE INDEX IX_MediaShares_MediaItemId ON MediaShares (MediaItemId);
CREATE INDEX IX_MediaShares_SharedByUserId ON MediaShares (SharedByUserId);
CREATE INDEX IX_MediaShares_SharedToUserId ON MediaShares (SharedToUserId);

/* PlaylistItems (khoa chinh kep) */
CREATE TABLE PlaylistItems (
    PlaylistId  UNIQUEIDENTIFIER NOT NULL,
    MediaItemId UNIQUEIDENTIFIER NOT NULL,
    Id          UNIQUEIDENTIFIER NOT NULL,
    AddedAt     DATETIME2        NOT NULL,
    CONSTRAINT PK_PlaylistItems PRIMARY KEY (PlaylistId, MediaItemId),
    CONSTRAINT FK_PlaylistItems_Playlists_PlaylistId
        FOREIGN KEY (PlaylistId) REFERENCES Playlists (Id),
    CONSTRAINT FK_PlaylistItems_MediaItems_MediaItemId
        FOREIGN KEY (MediaItemId) REFERENCES MediaItems (Id)
);
CREATE INDEX IX_PlaylistItems_MediaItemId ON PlaylistItems (MediaItemId);

/* Genres */
CREATE TABLE Genres (
    Id          UNIQUEIDENTIFIER NOT NULL,
    Name        NVARCHAR(MAX)    NOT NULL,
    Description NVARCHAR(MAX)    NOT NULL,
    CONSTRAINT PK_Genres PRIMARY KEY (Id)
);

/* MediaGenres (khoa chinh kep) */
CREATE TABLE MediaGenres (
    MediaItemId UNIQUEIDENTIFIER NOT NULL,
    GenreId     UNIQUEIDENTIFIER NOT NULL,
    AddedAt     DATETIME2        NOT NULL,
    CONSTRAINT PK_MediaGenres PRIMARY KEY (MediaItemId, GenreId),
    CONSTRAINT FK_MediaGenres_MediaItems_MediaItemId
        FOREIGN KEY (MediaItemId) REFERENCES MediaItems (Id) ON DELETE CASCADE,
    CONSTRAINT FK_MediaGenres_Genres_GenreId
        FOREIGN KEY (GenreId) REFERENCES Genres (Id) ON DELETE CASCADE
);
CREATE INDEX IX_MediaGenres_GenreId ON MediaGenres (GenreId);

/* PlayHistory */
CREATE TABLE PlayHistory (
    Id                      UNIQUEIDENTIFIER NOT NULL,
    UserId                  UNIQUEIDENTIFIER NOT NULL,
    MediaItemId             UNIQUEIDENTIFIER NOT NULL,
    PlayedAt                DATETIME2        NOT NULL,
    DurationSeconds   INT              NULL,
    CONSTRAINT PK_PlayHistory PRIMARY KEY (Id),
    CONSTRAINT FK_PlayHistory_UserProfiles_UserId
        FOREIGN KEY (UserId) REFERENCES UserProfiles (Id) ON DELETE CASCADE,
    CONSTRAINT FK_PlayHistory_MediaItems_MediaItemId
        FOREIGN KEY (MediaItemId) REFERENCES MediaItems (Id) ON DELETE CASCADE
);
CREATE INDEX IX_PlayHistory_UserId ON PlayHistory (UserId);
CREATE INDEX IX_PlayHistory_MediaItemId ON PlayHistory (MediaItemId);
CREATE INDEX IX_PlayHistory_PlayedAt ON PlayHistory (PlayedAt);
