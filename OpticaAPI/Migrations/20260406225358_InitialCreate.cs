using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpticaAPI.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Pacientes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Apellido = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FechaNacimiento = table.Column<DateOnly>(type: "date", nullable: true),
                    Telefono = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    FechaEliminacion = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pacientes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Graduaciones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PacienteId = table.Column<int>(type: "int", nullable: false),
                    Fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    OD_Esfera = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    OD_Cilindro = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    OD_Eje = table.Column<int>(type: "int", nullable: true),
                    OD_Adicion = table.Column<decimal>(type: "decimal(4,2)", precision: 4, scale: 2, nullable: true),
                    OD_AV = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    OI_Esfera = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    OI_Cilindro = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    OI_Eje = table.Column<int>(type: "int", nullable: true),
                    OI_Adicion = table.Column<decimal>(type: "decimal(4,2)", precision: 4, scale: 2, nullable: true),
                    OI_AV = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    DistanciaPupilar = table.Column<decimal>(type: "decimal(5,1)", precision: 5, scale: 1, nullable: true),
                    Observaciones = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Optometrista = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Graduaciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Graduaciones_Pacientes_PacienteId",
                        column: x => x.PacienteId,
                        principalTable: "Pacientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Graduaciones_Fecha",
                table: "Graduaciones",
                column: "Fecha");

            migrationBuilder.CreateIndex(
                name: "IX_Graduaciones_PacienteId",
                table: "Graduaciones",
                column: "PacienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Pacientes_Apellido_Nombre",
                table: "Pacientes",
                columns: new[] { "Apellido", "Nombre" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Graduaciones");

            migrationBuilder.DropTable(
                name: "Pacientes");
        }
    }
}
