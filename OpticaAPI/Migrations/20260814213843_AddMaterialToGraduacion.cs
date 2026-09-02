using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpticaAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddMaterialToGraduacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Diseno",
                table: "Graduaciones",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Material",
                table: "Graduaciones",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tratamiento",
                table: "Graduaciones",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Diseno",
                table: "Graduaciones");

            migrationBuilder.DropColumn(
                name: "Material",
                table: "Graduaciones");

            migrationBuilder.DropColumn(
                name: "Tratamiento",
                table: "Graduaciones");
        }
    }
}
