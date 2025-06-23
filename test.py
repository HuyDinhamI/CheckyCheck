import pygame
import sys

pygame.init()

# Initialize screen and font
screen = pygame.display.set_mode((400, 400))
clock = pygame.time.Clock()

# Vietnamese vowels and tone marks
vn_vowels = 'AĂÂEÊIOÔƠUƯYaăâeêioôơuưy'
sac = 'ÁẮẤÉẾÍÓỐỚÚỨÝáắấéếíóốớúứý'
huyen = 'ÀẦẰÈỀÌÒỒỜÙỪỲàầằèềìòồờùừỳ'
hoi = 'ẢẨẲẺỂỈỎỔỞỦỬỶảẩẳẻểỉỏổởủửỷ'  
nga = 'ÃẪẴẼỄĨÕỗỠŨỮỸãẫẵẽễĩõỗỡũữỹ'
nang = 'ẠẬẶẸỆỊỌỘỢỤỰỴạậặẹệịọộợụựỵ'

name = ''  # Initialize the input name

# Game loop
while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

        if event.type == pygame.KEYDOWN:
            if event.unicode.isalpha():  # If the key pressed is a letter
                name += event.unicode

                if len(name) >= 2:
                    # Apply specific rules for character combinations
                    if name[-1] == name[-2] == 'e':
                        name = name[:-2] + 'ê'
                    elif name[-1] == name[-2] == 'o':
                        name = name[:-2] + 'ô'
                    elif name[-1] == name[-2] == 'a':
                        name = name[:-2] + 'â'
                    elif name[-2] == 'a' and name[-1] == 'w':
                        name = name[:-2] + 'ă'
                    elif name[-2] == 'o' and name[-1] == 'w':
                        name = name[:-2] + 'ơ'
                    elif name[-2] == 'u' and name[-1] == 'w':
                        name = name[:-2] + 'ư'
                    elif name[-1] == name[-2] == 'd':
                        name = name[:-2] + 'đ'
                    elif name[-1] == name[-2] == 'E':
                        name = name[:-2] + 'Ê'
                    elif name[-1] == name[-2] == 'O':
                        name = name[:-2] + 'Ô'
                    elif name[-1] == name[-2] == 'A':
                        name = name[:-2] + 'Â'
                    elif name[-2] == 'A' and name[-1] == 'w':
                        name = name[:-2] + 'Ă'
                    elif name[-2] == 'O' and name[-1] == 'w':
                        name = name[:-2] + 'Ơ'
                    elif name[-2] == 'U' and name[-1] == 'w':
                        name = name[:-2] + 'Ư'
                    elif name[-1] == name[-2] == 'D':
                        name = name[:-2] + 'Đ'

                    # Replace vowel + tone modifier combinations
                    for i in range(len(vn_vowels)):
                        if len(name) >= 2:
                            if name[-2] == vn_vowels[i]:
                                if name[-1] == 's':
                                    name = name[:-2] + sac[i]
                                elif name[-1] == 'f':
                                    name = name[:-2] + huyen[i]
                                elif name[-1] == 'r':
                                    name = name[:-2] + hoi[i]
                                elif name[-1] == 'x':
                                    name = name[:-2] + nga[i]
                                elif name[-1] == 'j':
                                    name = name[:-2] + nang[i]

            elif event.key == pygame.K_BACKSPACE:
                name = name[:-1]  # Delete last character
            elif event.key == pygame.K_SPACE:
                name += ' '  # Add a space
            elif event.key == pygame.K_RETURN:
                # Placeholder for action on pressing Enter (example: navigating to another page)
                showStartPage = False  # Set showStartPage flag

    # Rendering
    screen.fill((255, 255, 255))  # Fill screen with white
    text_font = pygame.font.Font(None, 32)  # Use default font
    rendered_text = text_font.render(name, True, (0, 0, 0))  # Render the text
    screen.blit(rendered_text, (40, 40))  # Display the text

    pygame.display.flip()  # Update the display
    clock.tick(60)  # Maintain 60 frames per second
