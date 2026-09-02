using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpticaAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddMultiTenancy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OpticaId",
                table: "Usuarios",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SucursalId",
                table: "Usuarios",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OpticaId",
                table: "Pacientes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OptometristaId",
                table: "Graduaciones",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SucursalId",
                table: "Graduaciones",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Opticas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    RazonSocial = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Telefono = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Opticas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Sucursales",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OpticaId = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Direccion = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Telefono = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sucursales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Sucursales_Opticas_OpticaId",
                        column: x => x.OpticaId,
                        principalTable: "Opticas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Optometristas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SucursalId = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Apellido = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Cedula = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Telefono = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Optometristas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Optometristas_Sucursales_SucursalId",
                        column: x => x.SucursalId,
                        principalTable: "Sucursales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_OpticaId",
                table: "Usuarios",
                column: "OpticaId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_SucursalId",
                table: "Usuarios",
                column: "SucursalId");

            migrationBuilder.CreateIndex(
                name: "IX_Pacientes_OpticaId",
                table: "Pacientes",
                column: "OpticaId");

            migrationBuilder.CreateIndex(
                name: "IX_Graduaciones_OptometristaId",
                table: "Graduaciones",
                column: "OptometristaId");

            migrationBuilder.CreateIndex(
                name: "IX_Graduaciones_SucursalId",
                table: "Graduaciones",
                column: "SucursalId");

            migrationBuilder.CreateIndex(
                name: "IX_Opticas_Nombre",
                table: "Opticas",
                column: "Nombre");

            migrationBuilder.CreateIndex(
                name: "IX_Optometristas_SucursalId",
                table: "Optometristas",
                column: "SucursalId");

            migrationBuilder.CreateIndex(
                name: "IX_Sucursales_OpticaId",
                table: "Sucursales",
                column: "OpticaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Graduaciones_Optometristas_OptometristaId",
                table: "Graduaciones",
                column: "OptometristaId",
                principalTable: "Optometristas",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Graduaciones_Sucursales_SucursalId",
                table: "Graduaciones",
                column: "SucursalId",
                principalTable: "Sucursales",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Pacientes_Opticas_OpticaId",
                table: "Pacientes",
                column: "OpticaId",
                principalTable: "Opticas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Usuarios_Opticas_OpticaId",
                table: "Usuarios",
                column: "OpticaId",
                principalTable: "Opticas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Usuarios_Sucursales_SucursalId",
                table: "Usuarios",
                column: "SucursalId",
                principalTable: "Sucursales",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Graduaciones_Optometristas_OptometristaId",
                table: "Graduaciones");

            migrationBuilder.DropForeignKey(
                name: "FK_Graduaciones_Sucursales_SucursalId",
                table: "Graduaciones");

            migrationBuilder.DropForeignKey(
                name: "FK_Pacientes_Opticas_OpticaId",
                table: "Pacientes");

            migrationBuilder.DropForeignKey(
                name: "FK_Usuarios_Opticas_OpticaId",
                table: "Usuarios");

            migrationBuilder.DropForeignKey(
                name: "FK_Usuarios_Sucursales_SucursalId",
                table: "Usuarios");

            migrationBuilder.DropTable(
                name: "Optometristas");

            migrationBuilder.DropTable(
                name: "Sucursales");

            migrationBuilder.DropTable(
                name: "Opticas");

            migrationBuilder.DropIndex(
                name: "IX_Usuarios_OpticaId",
                table: "Usuarios");

            migrationBuilder.DropIndex(
                name: "IX_Usuarios_SucursalId",
                table: "Usuarios");

            migrationBuilder.DropIndex(
                name: "IX_Pacientes_OpticaId",
                table: "Pacientes");

            migrationBuilder.DropIndex(
                name: "IX_Graduaciones_OptometristaId",
                table: "Graduaciones");

            migrationBuilder.DropIndex(
                name: "IX_Graduaciones_SucursalId",
                table: "Graduaciones");

            migrationBuilder.DropColumn(
                name: "OpticaId",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "SucursalId",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "OpticaId",
                table: "Pacientes");

            migrationBuilder.DropColumn(
                name: "OptometristaId",
                table: "Graduaciones");

            migrationBuilder.DropColumn(
                name: "SucursalId",
                table: "Graduaciones");
        }
    }
}
